import { Router } from 'express'
import { userSearchHandler } from '../controllers/roblox.controller'
import { validateQuery } from '../middleware/validation.middleware'
import { userSearchQuerySchema } from '../schemas/roblox.schema'

const robloxRouter: Router = Router()

robloxRouter.get(
    '/users/search',
    validateQuery(userSearchQuerySchema),
    userSearchHandler,
)

export { robloxRouter }
