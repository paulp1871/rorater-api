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
                // ISO string (not a Date) so the result is fully JSON-safe, like
                // raterId above: callers may cache it, and a Date would silently
                // become a string on the JSON round-trip while still typed Date.
                createdAt: mostRecent.createdAt.toISOString(),
            }
            : null,
    }
}
