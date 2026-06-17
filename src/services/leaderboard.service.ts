import { getUserAvatarsFromRoblox, getUsersByIdsFromRoblox } from '../clients/roblox.client'
import { getRecentlyRatedUsers, getTopRatedUsersSince } from '../db/rating.db'
import { LEADERBOARD_TTL, leaderboardCacheKey, withCache } from '../stores/roblox.cache'

const DAY_MS = 24 * 60 * 60 * 1000
// Only ratees with at least this many ratings in the window qualify, so a single
// high score can't top the board.
const MIN_RATINGS_FOR_TOP = 3
const TOP_WINDOW_DAYS = 7
// The cache holds this many entries per kind under one key; requests slice it
// down to their limit. This decouples the cache (and the Roblox lookups behind
// it) from the caller-supplied limit, so anonymous traffic can't mint a fresh
// Roblox batch call per distinct ?limit= value.
const MAX_ENTRIES = 50

type Thumbnail = { url: string | null; state: string } | null

type LeaderboardUser = {
    id: number
    username: string
    displayName: string
    hasVerifiedBadge: boolean
    avatar: Thumbnail
}

type TopRatedEntry = {
    user: LeaderboardUser
    averageRating: number
    ratingCount: number
}

type RecentlyRatedEntry = {
    user: LeaderboardUser
    lastRatedAt: string
    averageRating: number
    ratingCount: number
}

type AvatarData = Awaited<ReturnType<typeof getUserAvatarsFromRoblox>>['data'][number]

const formatAvatar = (avatar: AvatarData | null | undefined): Thumbnail => {
    if (!avatar) return null
    return {
        url: avatar.state === 'Completed' ? avatar.imageUrl : null,
        state: avatar.state,
    }
}

// Resolves Roblox username + avatar for a set of ratee ids in two batched calls,
// then maps each row to its entry. Rows whose Roblox user can't be resolved are
// dropped (rather than emitting a nameless entry); ranking order is preserved.
// Roblox ids are stored as BigInt but fit the numeric users/avatar APIs, so they
// are narrowed to number here as elsewhere in the app.
const enrich = async <Row extends { ratedId: bigint }, Entry>(
    rows: Row[],
    toEntry: (row: Row, user: LeaderboardUser) => Entry,
): Promise<Entry[]> => {
    if (rows.length === 0) return []

    const ids = rows.map((row) => Number(row.ratedId))
    const [usersResponse, avatarResponse] = await Promise.all([
        getUsersByIdsFromRoblox(ids),
        getUserAvatarsFromRoblox(ids),
    ])

    const avatarsByUserId = new Map(
        avatarResponse.data.map((avatar) => [avatar.targetId, avatar]),
    )
    const usersById = new Map(
        usersResponse.data.map((user) => [user.id, {
            id: user.id,
            username: user.name,
            displayName: user.displayName,
            hasVerifiedBadge: user.hasVerifiedBadge,
            avatar: formatAvatar(avatarsByUserId.get(user.id)),
        }]),
    )

    return rows.flatMap((row) => {
        const user = usersById.get(Number(row.ratedId))
        return user ? [toEntry(row, user)] : []
    })
}

const topRatedEntries = (): Promise<TopRatedEntry[]> =>
    withCache(leaderboardCacheKey('top'), LEADERBOARD_TTL, async () => {
        const since = new Date(Date.now() - TOP_WINDOW_DAYS * DAY_MS)
        const rows = await getTopRatedUsersSince(since, MAX_ENTRIES, MIN_RATINGS_FOR_TOP)
        return enrich(rows, (row, user) => ({
            user,
            averageRating: row.averageRating,
            ratingCount: row.ratingCount,
        }))
    })

const recentlyRatedEntries = (): Promise<RecentlyRatedEntry[]> =>
    withCache(leaderboardCacheKey('recent'), LEADERBOARD_TTL, async () => {
        const rows = await getRecentlyRatedUsers(MAX_ENTRIES)
        return enrich(rows, (row, user) => ({
            user,
            // ISO string so the result survives the cache's JSON round-trip.
            lastRatedAt: row.lastRatedAt.toISOString(),
            averageRating: row.averageRating,
            ratingCount: row.ratingCount,
        }))
    })

export const getTopRatedLeaderboard = async (limit: number): Promise<{ entries: TopRatedEntry[] }> => ({
    entries: (await topRatedEntries()).slice(0, limit),
})

export const getRecentlyRatedLeaderboard = async (limit: number): Promise<{ entries: RecentlyRatedEntry[] }> => ({
    entries: (await recentlyRatedEntries()).slice(0, limit),
})
