import { prisma } from './prisma'

export const upsertUser = (robloxId: bigint): Promise<void> =>
    prisma.user.upsert({
        where: { robloxId },
        update: { lastLoginAt: new Date() },
        create: { robloxId, lastLoginAt: new Date() },
        select: { robloxId: true },
    }).then(() => undefined)

// Guarantees a users row exists for a Roblox ID without touching lastLoginAt,
// so a rating can reference a user who has been rated but never logged in.
// Rating.ratedId is a foreign key to User.robloxId, so this must run before the
// first rating insert for that user to avoid a constraint violation. (upsertUser
// is unsuitable here: it bumps lastLoginAt, which is only meaningful on login.)
export const ensureUserExists = (robloxId: bigint): Promise<void> =>
    prisma.user.upsert({
        where: { robloxId },
        update: {},
        create: { robloxId },
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
            // raterId is deliberately omitted: this stat is served to every
            // profile viewer, so exposing who left the most recent rating would
            // leak rater identities. A rater sees their own rating via the
            // /api/ratings endpoint instead.
            select: { score: true, createdAt: true },
        }),
    ])

    return {
        averageRating: aggregate._count.score > 0 ? aggregate._avg.score : null,
        mostRecentRating: mostRecent
            ? {
                score: mostRecent.score,
                // ISO string (not a Date) so the result is fully JSON-safe:
                // callers may cache it, and a Date would silently become a
                // string on the JSON round-trip while still typed Date.
                createdAt: mostRecent.createdAt.toISOString(),
            }
            : null,
    }
}
