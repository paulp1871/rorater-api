import { env } from './config/env'
import express, { Application, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { robloxRouter } from './routes/roblox.routes'
import { authRouter } from './routes/auth.routes'
import { ratingRouter } from './routes/rating.routes'
import { leaderboardRouter } from './routes/leaderboard.routes'
import { globalRateLimiter } from './middleware/rateLimit.middleware'
import { appErrorHandler } from './middleware/appError.middleware'
import { robloxErrorHandler } from './middleware/robloxError.middleware'
import { errorLogger, requestLogger } from './middleware/logging.middleware'

const app: Application = express()

const isDevelopment = env.NODE_ENV === 'development'

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
    origin: new URL(env.FRONTEND_URL).origin,
    credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.json({ limit: '16kb' }))

if (isDevelopment) {
    app.use(requestLogger)
}

app.use(globalRateLimiter)

app.use('/api/roblox', robloxRouter)
app.use('/api/auth', authRouter)
app.use('/api/ratings', ratingRouter)
app.use('/api/leaderboard', leaderboardRouter)

app.use(errorLogger)
app.use(appErrorHandler)
app.use(robloxErrorHandler)

export { app }
