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

export const deleteRating = (
    raterId: bigint,
    ratedId: bigint,
): Promise<{ count: number }> =>
    prisma.rating.deleteMany({ where: { raterId, ratedId } })

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
        averageRating: group._avg.score ?? 0,
        ratingCount: group._count.score,
    }))
}

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
        lastRatedAt: group._max.createdAt as Date,
        averageRating: group._avg.score ?? 0,
        ratingCount: group._count.score,
    }))
}
