import { Router } from 'express'
import { recentlyRatedHandler, topRatedHandler } from '../controllers/leaderboard.controller'
import { validateQuery, type ValidatedQueryLocals } from '../middleware/validation.middleware'
import { leaderboardQuerySchema, type LeaderboardQuery } from '../schemas/leaderboard.schema'

const leaderboardRouter = Router()

// Public: leaderboards expose only aggregate, non-identifying data (no raterId),
// so no session is required. See the cache note in leaderboard.service for how
// the Roblox lookups behind these endpoints are shielded from anonymous traffic.
type LeaderboardLocals = ValidatedQueryLocals<LeaderboardQuery>

leaderboardRouter.get<'/top', Record<string, string>, unknown, unknown, unknown, LeaderboardLocals>(
    '/top',
    validateQuery(leaderboardQuerySchema),
    topRatedHandler,
)

leaderboardRouter.get<'/recent', Record<string, string>, unknown, unknown, unknown, LeaderboardLocals>(
    '/recent',
    validateQuery(leaderboardQuerySchema),
    recentlyRatedHandler,
)

export { leaderboardRouter }
