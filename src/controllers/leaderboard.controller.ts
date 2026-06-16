import type { RequestHandler } from 'express'
import type { ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { LeaderboardQuery } from '../schemas/leaderboard.schema'
import { getRecentlyRatedLeaderboard, getTopRatedLeaderboard } from '../services/leaderboard.service'

export const topRatedHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<LeaderboardQuery>
> = async (req, res, next) => {
    try {
        const result = await getTopRatedLeaderboard(res.locals.validatedQuery.limit)
        res.json(result)
    } catch (error) {
        next(error)
    }
}

export const recentlyRatedHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<LeaderboardQuery>
> = async (req, res, next) => {
    try {
        const result = await getRecentlyRatedLeaderboard(res.locals.validatedQuery.limit)
        res.json(result)
    } catch (error) {
        next(error)
    }
}
