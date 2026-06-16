import { env } from './config/env'
import express, { Application, Request, Response } from 'express'
import helmet from 'helmet'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'
import { robloxRouter } from './routes/roblox.routes'
import { authRouter } from './routes/auth.routes'
import { ratingRouter } from './routes/rating.routes'
import { globalRateLimiter } from './middleware/rateLimit.middleware'
import { appErrorHandler } from './middleware/appError.middleware'
import { robloxErrorHandler } from './middleware/robloxError.middleware'
import { errorLogger, requestLogger } from './middleware/logging.middleware'

const app: Application = express()

const isDevelopment = env.NODE_ENV === 'development'

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Verbose request/error logging is a development-only convenience, so it is
// only added to the chain when NODE_ENV=development.
if (isDevelopment) {
    app.use(requestLogger)
}

app.use(globalRateLimiter)

app.get('/', (req: Request, res: Response<{ message: string }>): void => {
    res.json({ message: 'Hello World!' })
})

app.use('/api/roblox', robloxRouter)
app.use('/api/auth', authRouter)
app.use('/api/ratings', ratingRouter)
app.use(errorLogger)

// Must be registered after the routers so thrown/rejected handler errors land
// here. Express 5 forwards rejected async handlers automatically. appErrorHandler
// runs first to map known AppErrors to their status; robloxErrorHandler is the
// final fallback (Roblox rate limits → 429, everything else → 502).
app.use(appErrorHandler)
app.use(robloxErrorHandler)

export { app }
