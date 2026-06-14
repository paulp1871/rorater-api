import { Router } from 'express'
import { userSearchHandler } from '../controllers/roblox.controller'
import { requireSession, type SessionLocals } from '../middleware/auth.middleware'
import { validateQuery, type ValidatedQueryLocals } from '../middleware/validation.middleware'
import { userSearchQuerySchema, type UserSearchQuery } from '../schemas/roblox.schema'

const robloxRouter = Router()

interface UserSearchLocals extends SessionLocals, ValidatedQueryLocals<UserSearchQuery> {}

robloxRouter.get<'/users/search', Record<string, string>, unknown, unknown, unknown, UserSearchLocals>(
    '/users/search',
    requireSession,
    validateQuery(userSearchQuerySchema),
    userSearchHandler,
)

export { robloxRouter }
