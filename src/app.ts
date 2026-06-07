import { env } from './config/env'
import express, { Application, Request, Response } from 'express'
import cors, { CorsOptions } from 'cors'
import cookieParser from 'cookie-parser'
import { robloxRouter } from './routes/roblox.routes'
import { authRouter } from './routes/auth.routes'

const app: Application = express()

app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req: Request, res: Response<{ message: string }>): void => {
    res.json({ message: 'Hello World!' })
})

app.use('/api/roblox', robloxRouter)
app.use('/api/auth', authRouter)

export { app }
