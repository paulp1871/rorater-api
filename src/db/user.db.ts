import { prisma } from './prisma'

export const upsertUser = (robloxId: bigint): Promise<void> =>
    prisma.user.upsert({
        where: { robloxId },
        update: { lastLoginAt: new Date() },
        create: { robloxId, lastLoginAt: new Date() },
        select: { robloxId: true },
    }).then(() => undefined)
