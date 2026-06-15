import { Router } from 'express'
import { userProfileHandler, userSearchHandler } from '../controllers/roblox.controller'
import { requireSession, type SessionLocals } from '../middleware/auth.middleware'
import { validateParams, validateQuery, type ValidatedParamsLocals, type ValidatedQueryLocals } from '../middleware/validation.middleware'
import { userIdParamSchema, userSearchQuerySchema, type UserIdParam, type UserSearchQuery } from '../schemas/roblox.schema'

const robloxRouter = Router()

interface UserSearchLocals extends SessionLocals, ValidatedQueryLocals<UserSearchQuery> {}
interface UserProfileLocals extends SessionLocals, ValidatedParamsLocals<UserIdParam> {}

robloxRouter.get<'/users/search', Record<string, string>, unknown, unknown, unknown, UserSearchLocals>(
    '/users/search',
    requireSession,
    validateQuery(userSearchQuerySchema),
    userSearchHandler,
)

robloxRouter.get<'/users/:id', Record<string, string>, unknown, unknown, unknown, UserProfileLocals>(
    '/users/:id',
    requireSession,
    validateParams(userIdParamSchema),
    userProfileHandler,
)

export { robloxRouter }
