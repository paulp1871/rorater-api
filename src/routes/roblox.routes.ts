import { Router } from 'express'
import { userSearchHandler } from '../controllers/roblox.controller'
import { requireSession } from '../middleware/auth.middleware'
import type { SessionLocals } from '../middleware/auth.middleware'
import { validateQuery } from '../middleware/validation.middleware'
import type { ValidatedQueryLocals } from '../middleware/validation.middleware'
import { userSearchQuerySchema } from '../schemas/roblox.schema'
import type { UserSearchQuery } from '../schemas/roblox.schema'

const robloxRouter: Router = Router()

interface UserSearchLocals
    extends SessionLocals,
        ValidatedQueryLocals<UserSearchQuery> {}

robloxRouter.get<
    '/users/search',
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    UserSearchLocals
>(
    '/users/search',
    requireSession,
    validateQuery(userSearchQuerySchema),
    userSearchHandler,
)

export { robloxRouter }
