import { Router } from 'express'
import { deleteRatingHandler, getMyRatingHandler, rateUserHandler } from '../controllers/rating.controller'
import { requireSession, type SessionLocals } from '../middleware/auth.middleware'
import { requireFrontendOrigin } from '../middleware/origin.middleware'
import { validateBody, validateParams, type ValidatedBodyLocals, type ValidatedParamsLocals } from '../middleware/validation.middleware'
import { ratedUserIdParamSchema, ratingBodySchema, type RatedUserIdParam, type RatingBody } from '../schemas/rating.schema'

const ratingRouter = Router()

interface RatingReadLocals extends SessionLocals, ValidatedParamsLocals<RatedUserIdParam> {}
interface RatingWriteLocals extends RatingReadLocals, ValidatedBodyLocals<RatingBody> {}

ratingRouter.get<'/users/:userId', Record<string, string>, unknown, unknown, unknown, RatingReadLocals>(
    '/users/:userId',
    requireSession,
    validateParams(ratedUserIdParamSchema),
    getMyRatingHandler,
)

ratingRouter.put<'/users/:userId', Record<string, string>, unknown, unknown, unknown, RatingWriteLocals>(
    '/users/:userId',
    requireSession,
    requireFrontendOrigin,
    validateParams(ratedUserIdParamSchema),
    validateBody(ratingBodySchema),
    rateUserHandler,
)

ratingRouter.delete<'/users/:userId', Record<string, string>, unknown, unknown, unknown, RatingReadLocals>(
    '/users/:userId',
    requireSession,
    requireFrontendOrigin,
    validateParams(ratedUserIdParamSchema),
    deleteRatingHandler,
)

export { ratingRouter }
