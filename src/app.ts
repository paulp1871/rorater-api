import express from 'express'
import type { Application, Request, Response } from 'express'
import { robloxRouter } from './routes/roblox.routes'

const app: Application = express()

app.use(express.urlencoded({ extended: true }))

app.use(express.json())

app.get('/', (req: Request, res: Response<{ message: string }>): void => {
    res.json({ message: 'Hello World!' })
})

app.use('/api/roblox', robloxRouter)

export { app }
