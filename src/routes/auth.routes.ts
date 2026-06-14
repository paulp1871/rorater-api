import { Router } from 'express'
import {
    handleRobloxCallback,
    logoutHandler,
    meHandler,
    startRobloxLogin,
} from '../controllers/auth.controller'
import { requireSession } from '../middleware/auth.middleware'
import { requireFrontendOrigin } from '../middleware/origin.middleware'
import { authRateLimiter } from '../middleware/rateLimit.middleware'
import { validateQuery } from '../middleware/validation.middleware'
import { robloxCallbackQuerySchema } from '../schemas/auth.schema'

const authRouter = Router()

authRouter.post('/login', authRateLimiter, requireFrontendOrigin, startRobloxLogin)
authRouter.get('/roblox/callback', authRateLimiter, validateQuery(robloxCallbackQuerySchema), handleRobloxCallback)
authRouter.get('/me', requireSession, meHandler)
authRouter.post('/logout', requireFrontendOrigin, logoutHandler)

export { authRouter }
