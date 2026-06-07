import { Router } from 'express'
import {
    handleRobloxCallback,
    logoutHandler,
    meHandler,
    startRobloxLogin,
} from '../controllers/auth.controller'
import { validateQuery } from '../middleware/validation.middleware'
import { robloxCallbackQuerySchema } from '../schemas/auth.schema'

const authRouter: Router = Router()

authRouter.get('/roblox/login', startRobloxLogin)

authRouter.get(
    '/roblox/callback',
    validateQuery(robloxCallbackQuerySchema),
    handleRobloxCallback,
)

authRouter.get('/me', meHandler)

authRouter.post('/logout', logoutHandler)

export { authRouter }
