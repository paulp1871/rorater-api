import { fetchApi } from 'rozod'
import type { EndpointSchema, ExtractParams, ExtractResponse } from 'rozod'
import { getUsersUseridAvatar } from 'rozod/endpoints/avatarv1'
import { getUsersAvatar, getUsersAvatar3d } from 'rozod/endpoints/thumbnailsv1'
import { getUsersSearch, getUsersUserid, postUsers } from 'rozod/endpoints/usersv1'
import { RobloxRateLimitError } from '../errors/roblox.errors'

// Retry/backoff tuning. We retry transient upstream failures (429 + 5xx) with
// exponential backoff and jitter so a brief Roblox hiccup or rate-limit burst
// doesn't surface as an error on the first try.
const MAX_RETRIES = 3
const BASE_DELAY_MS = 300
const MAX_DELAY_MS = 5_000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Roblox sends Retry-After as either a delay in seconds or an HTTP date. We
// only surface the seconds form; anything else is treated as "no hint".
const parseRetryAfterSeconds = (header: string | null): number | undefined => {
    if (!header) return undefined
    const seconds = Number(header)
    return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

// Exponential backoff (300ms, 600ms, 1200ms, ...) capped, with full jitter to
// avoid a thundering herd when many parallel calls are throttled at once. A
// server-provided Retry-After always wins over our computed delay.
const backoffDelayMs = (attempt: number, retryAfterSeconds?: number): number => {
    if (retryAfterSeconds !== undefined) return retryAfterSeconds * 1000
    const ceiling = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
    return Math.random() * ceiling
}

// Single entry point for every Roblox call. Using rozod's returnRaw option keeps
// the raw Response in hand so we can inspect the HTTP status: a 429 (after
// retries are exhausted) becomes a typed RobloxRateLimitError handled by the
// error middleware, other non-OK responses bubble up as generic errors. On
// success the typed JSON is returned, matching the shape callers had before.
const callRoblox = async <S extends EndpointSchema>(
    endpoint: S,
    params: ExtractParams<S>,
    init: RequestInit = {},
): Promise<ExtractResponse<S>> => {
    for (let attempt = 0; ; attempt++) {
        const response = await fetchApi(endpoint, params, { ...init, returnRaw: true })

        if (response.ok) {
            return response.json()
        }

        const isRetryable = response.status === 429 || response.status >= 500
        if (isRetryable && attempt < MAX_RETRIES) {
            const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'))
            await sleep(backoffDelayMs(attempt, retryAfterSeconds))
            continue
        }

        if (response.status === 429) {
            throw new RobloxRateLimitError(parseRetryAfterSeconds(response.headers.get('retry-after')))
        }

        throw new Error(`Roblox API request failed with status ${response.status}`)
    }
}

const withBearerAuth = (accessToken: string): RequestInit => ({
    headers: { Authorization: `Bearer ${accessToken}` },
})

export const searchUsersFromRoblox = (
    keyword: string,
    limit: 10 | 25 | 50 | 100 = 10,
) => callRoblox(getUsersSearch, { keyword, limit })

export const getUserAvatarsFromRoblox = (userIds: number[]) =>
    callRoblox(getUsersAvatar, {
        userIds,
        size: '180x180',
        format: 'Webp',
        isCircular: false,
    })

export const getUserInfoFromRoblox = (userId: number) =>
    callRoblox(getUsersUserid, { userId })

// Batch user lookup (POST /v1/users). Resolves many ids in one call, so
// leaderboard enrichment avoids an N+1 of per-user getUserInfoFromRoblox hits.
// excludeBannedUsers stays false so a banned ratee still resolves rather than
// dropping out of the response and leaving a gap in the leaderboard.
export const getUsersByIdsFromRoblox = (userIds: number[]) =>
    callRoblox(postUsers, { body: { userIds, excludeBannedUsers: false } })

export const getUserAvatarDetailsFromRoblox = (userId: number) =>
    callRoblox(getUsersUseridAvatar, { userId })

export const getUserAvatar3dFromRoblox = (userId: number, accessToken: string) =>
    callRoblox(getUsersAvatar3d, { userId }, withBearerAuth(accessToken))
