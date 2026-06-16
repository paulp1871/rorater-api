import { Router } from 'express'
import { recentlyRatedHandler, topRatedHandler } from '../controllers/leaderboard.controller'
import { requireSession, type SessionLocals } from '../middleware/auth.middleware'
import { validateQuery, type ValidatedQueryLocals } from '../middleware/validation.middleware'
import { leaderboardQuerySchema, type LeaderboardQuery } from '../schemas/leaderboard.schema'

const leaderboardRouter = Router()

interface LeaderboardLocals extends SessionLocals, ValidatedQueryLocals<LeaderboardQuery> {}

leaderboardRouter.get<'/top', Record<string, string>, unknown, unknown, unknown, LeaderboardLocals>(
    '/top',
    requireSession,
    validateQuery(leaderboardQuerySchema),
    topRatedHandler,
)

leaderboardRouter.get<'/recent', Record<string, string>, unknown, unknown, unknown, LeaderboardLocals>(
    '/recent',
    requireSession,
    validateQuery(leaderboardQuerySchema),
    recentlyRatedHandler,
)

export { leaderboardRouter }
