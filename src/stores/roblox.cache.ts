import { redis } from '../config/redis'

export const SEARCH_TTL = 14400
export const PROFILE_TTL = 43200
// Short: a leaderboard shifts with every rating, so this only smooths bursts of
// requests away from the Roblox batch lookup rather than serving stale standings.
export const LEADERBOARD_TTL = 60

export const searchCacheKey = (keyword: string) => `roblox:search:${keyword.toLowerCase()}`
export const profileCacheKey = (userId: number) => `roblox:profile:${userId}`
export const leaderboardCacheKey = (kind: string, limit: number) =>
    `roblox:leaderboard:${kind}:${limit}`

// Tracks fetches that are currently running so concurrent callers for the same
// key share one result instead of each hitting Roblox (a cache stampede when a
// hot key expires). This is per-process: it collapses the common case of many
// simultaneous requests landing on one instance, but does not coordinate across
// instances — that would need a distributed lock and is not worth the latency.
const inFlight = new Map<string, Promise<unknown>>()

export const withCache = async <T>(
    key: string,
    ttlSeconds: number,
    fetch: () => Promise<T>,
): Promise<T> => {
    const raw = await redis.get(key)
    if (raw) return JSON.parse(raw) as T

    // A fetch for this key is already running — await its result rather than
    // starting a duplicate.
    const pending = inFlight.get(key)
    if (pending) return pending as Promise<T>

    // No await between the get above and the set below, so concurrent callers
    // cannot both miss the map and each start a fetch.
    const run = (async () => {
        try {
            const result = await fetch()
            await redis.set(key, JSON.stringify(result), { EX: ttlSeconds })
            return result
        } finally {
            // Clear on both success and failure so a rejected fetch is retried
            // next time rather than leaving a poisoned entry behind.
            inFlight.delete(key)
        }
    })()

    inFlight.set(key, run)
    return run as Promise<T>
}
