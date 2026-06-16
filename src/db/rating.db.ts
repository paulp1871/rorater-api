import { prisma } from './prisma'

// A rating returned to callers. BigInt IDs become strings and dates become ISO
// strings so the value is fully JSON-safe (mirrors getUserRatingStats).
export type RatingRecord = {
    raterId: string
    ratedId: string
    score: number
    createdAt: string
    updatedAt: string
}

type RatingRow = {
    raterId: bigint
    ratedId: bigint
    score: number
    createdAt: Date
    updatedAt: Date
}

const toRatingRecord = (row: RatingRow): RatingRecord => ({
    raterId: row.raterId.toString(),
    ratedId: row.ratedId.toString(),
    score: row.score,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
})

const ratingSelect = {
    raterId: true,
    ratedId: true,
    score: true,
    createdAt: true,
    updatedAt: true,
} as const

export const upsertRating = async (
    raterId: bigint,
    ratedId: bigint,
    score: number,
): Promise<RatingRecord> => {
    const row = await prisma.rating.upsert({
        where: { raterId_ratedId: { raterId, ratedId } },
        create: { raterId, ratedId, score },
        update: { score },
        select: ratingSelect,
    })

    return toRatingRecord(row)
}

export const getRating = async (
    raterId: bigint,
    ratedId: bigint,
): Promise<RatingRecord | null> => {
    const row = await prisma.rating.findUnique({
        where: { raterId_ratedId: { raterId, ratedId } },
        select: ratingSelect,
    })

    return row ? toRatingRecord(row) : null
}

// Uses deleteMany so a missing row resolves to { count: 0 } instead of throwing,
// letting the service decide whether absence is a 404.
export const deleteRating = (
    raterId: bigint,
    ratedId: bigint,
): Promise<{ count: number }> =>
    prisma.rating.deleteMany({ where: { raterId, ratedId } })

// Lightly-typed aggregate rows. ratedId stays a bigint and lastRatedAt a Date
// here; the service normalizes to JSON-safe values when it builds the response.
export type TopRatedRow = {
    ratedId: bigint
    averageRating: number
    ratingCount: number
}

export type RecentlyRatedRow = {
    ratedId: bigint
    lastRatedAt: Date
    averageRating: number
    ratingCount: number
}

// Top-rated ratees within a time window. minRatings filters out tiny-sample
// users (a lone 5 shouldn't outrank a well-rated 4.8). Ties on average break by
// rating count so the more-rated user ranks higher. Backed by the
// (rated_id, created_at) index.
export const getTopRatedUsersSince = async (
    since: Date,
    limit: number,
    minRatings: number,
): Promise<TopRatedRow[]> => {
    const groups = await prisma.rating.groupBy({
        by: ['ratedId'],
        where: { createdAt: { gte: since } },
        _avg: { score: true },
        _count: { score: true },
        having: { score: { _count: { gte: minRatings } } },
        orderBy: [
            { _avg: { score: 'desc' } },
            { _count: { score: 'desc' } },
        ],
        take: limit,
    })

    return groups.map((group) => ({
        ratedId: group.ratedId,
        // _avg is null only when the group is empty, which the count guarantees
        // it is not — coalesce to satisfy the type.
        averageRating: group._avg.score ?? 0,
        ratingCount: group._count.score,
    }))
}

// Distinct ratees ordered by their most recent rating. Aggregates come along so
// the leaderboard can show each user's overall average without a second query.
export const getRecentlyRatedUsers = async (
    limit: number,
): Promise<RecentlyRatedRow[]> => {
    const groups = await prisma.rating.groupBy({
        by: ['ratedId'],
        _max: { createdAt: true },
        _avg: { score: true },
        _count: { score: true },
        orderBy: { _max: { createdAt: 'desc' } },
        take: limit,
    })

    return groups.map((group) => ({
        ratedId: group.ratedId,
        // _max.createdAt is non-null for any non-empty group.
        lastRatedAt: group._max.createdAt as Date,
        averageRating: group._avg.score ?? 0,
        ratingCount: group._count.score,
    }))
}
