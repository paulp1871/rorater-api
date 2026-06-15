import { PrismaClient } from '../generated/prisma'
import { PrismaNeon } from '@prisma/adapter-neon'
import { env } from '../config/env'

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })

export const connectPrisma = (): Promise<void> => prisma.$connect()