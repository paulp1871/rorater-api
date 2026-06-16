import type { RequestHandler } from 'express'
import type { SessionLocals } from '../middleware/auth.middleware'
import type { ValidatedBodyLocals, ValidatedParamsLocals } from '../middleware/validation.middleware'
import type { RatedUserIdParam, RatingBody } from '../schemas/rating.schema'
import { getMyRating, rateUser, removeRating } from '../services/rating.service'

export const rateUserHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals & ValidatedParamsLocals<RatedUserIdParam> & ValidatedBodyLocals<RatingBody>
> = async (req, res, next) => {
    try {
        const rating = await rateUser(
            BigInt(res.locals.user.robloxUserId),
            res.locals.validatedParams.userId,
            res.locals.validatedBody.score,
        )
        res.json({ rating })
    } catch (error) {
        // Forward to appErrorHandler, which maps SelfRatingError (400) and other
        // AppErrors to their status; unknown errors fall through to a 502.
        next(error)
    }
}

export const getMyRatingHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals & ValidatedParamsLocals<RatedUserIdParam>
> = async (req, res, next) => {
    try {
        const rating = await getMyRating(
            BigInt(res.locals.user.robloxUserId),
            res.locals.validatedParams.userId,
        )
        res.json({ rating })
    } catch (error) {
        next(error)
    }
}

export const deleteRatingHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals & ValidatedParamsLocals<RatedUserIdParam>
> = async (req, res, next) => {
    try {
        await removeRating(
            BigInt(res.locals.user.robloxUserId),
            res.locals.validatedParams.userId,
        )
        res.status(204).end()
    } catch (error) {
        // Forward to appErrorHandler, which maps RatingNotFoundError to a 404.
        next(error)
    }
}
