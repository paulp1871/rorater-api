import { getUserAvatarsFromRoblox, getUsersByIdsFromRoblox } from '../clients/roblox.client'
import { getRecentlyRatedUsers, getTopRatedUsersSince } from '../db/rating.db'
import {
    LEADERBOARD_TTL,
    leaderboardCacheKey,
    withCache,
} from '../stores/roblox.cache'

// Only ratees with at least this many ratings in the window qualify for the
// top list, so a single high score can't top the board.
const MIN_RATINGS_FOR_TOP = 3
const TOP_WINDOW_DAYS = 7

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

// Resolves Roblox usernames and avatars for a set of ratee ids in two batched
// calls (one users lookup, one avatar lookup), returning a map keyed by id.
// Roblox ids are stored as BigInt but never exceed the avatar/users APIs'
// numeric ids, so they are narrowed to number for the client (as elsewhere).
const buildUserMap = async (
    ratedIds: bigint[],
): Promise<Map<number, LeaderboardUser>> => {
    const ids = ratedIds.map((id) => Number(id))

    const [usersResponse, avatarResponse] = await Promise.all([
        getUsersByIdsFromRoblox(ids),
        getUserAvatarsFromRoblox(ids),
    ])

    const avatarsByUserId = new Map(
        avatarResponse.data.map((avatar) => [avatar.targetId, avatar]),
    )

    return new Map(
        usersResponse.data.map((user) => [
            user.id,
            {
                id: user.id,
                username: user.name,
                displayName: user.displayName,
                hasVerifiedBadge: user.hasVerifiedBadge,
                avatar: formatAvatar(avatarsByUserId.get(user.id)),
            },
        ]),
    )
}

export const getTopRatedLeaderboard = (limit: number): Promise<{ entries: TopRatedEntry[] }> =>
    withCache(leaderboardCacheKey('top', limit), LEADERBOARD_TTL, async () => {
        const since = new Date(Date.now() - TOP_WINDOW_DAYS * 24 * 60 * 60 * 1000)
        const rows = await getTopRatedUsersSince(since, limit, MIN_RATINGS_FOR_TOP)

        if (rows.length === 0) return { entries: [] }

        const userMap = await buildUserMap(rows.map((row) => row.ratedId))

        return {
            // Drop rows whose Roblox user could not be resolved rather than
            // emit an entry with no name; ranking order is preserved.
            entries: rows.flatMap((row) => {
                const user = userMap.get(Number(row.ratedId))
                if (!user) return []
                return [{
                    user,
                    averageRating: row.averageRating,
                    ratingCount: row.ratingCount,
                }]
            }),
        }
    })

export const getRecentlyRatedLeaderboard = (limit: number): Promise<{ entries: RecentlyRatedEntry[] }> =>
    withCache(leaderboardCacheKey('recent', limit), LEADERBOARD_TTL, async () => {
        const rows = await getRecentlyRatedUsers(limit)

        if (rows.length === 0) return { entries: [] }

        const userMap = await buildUserMap(rows.map((row) => row.ratedId))

        return {
            entries: rows.flatMap((row) => {
                const user = userMap.get(Number(row.ratedId))
                if (!user) return []
                return [{
                    user,
                    // ISO string so the result is JSON-safe for the cache round-trip.
                    lastRatedAt: row.lastRatedAt.toISOString(),
                    averageRating: row.averageRating,
                    ratingCount: row.ratingCount,
                }]
            }),
        }
    })
