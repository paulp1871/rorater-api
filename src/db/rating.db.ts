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
