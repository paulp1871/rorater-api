import { prisma } from './prisma'

export const upsertUser = (robloxId: bigint): Promise<void> =>
    prisma.user.upsert({
        where: { robloxId },
        update: { lastLoginAt: new Date() },
        create: { robloxId, lastLoginAt: new Date() },
        select: { robloxId: true },
    }).then(() => undefined)

export const getUserRatingStats = async (robloxId: bigint) => {
    const [aggregate, mostRecent] = await Promise.all([
        prisma.rating.aggregate({
            where: { ratedId: robloxId },
            _avg: { score: true },
            _count: { score: true },
        }),
        prisma.rating.findFirst({
            where: { ratedId: robloxId },
            orderBy: { createdAt: 'desc' },
            select: { score: true, raterId: true, createdAt: true },
        }),
    ])

    return {
        averageRating: aggregate._count.score > 0 ? aggregate._avg.score : null,
        mostRecentRating: mostRecent
            ? {
                score: mostRecent.score,
                raterId: mostRecent.raterId.toString(),
                createdAt: mostRecent.createdAt,
            }
            : null,
    }
}
