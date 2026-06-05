import express from 'express'
import type { Application, Request, Response } from 'express'

const app: Application = express()

const PORT: number = 3000

app.use(express.urlencoded({ extended: true }))

app.use(express.json())

app.get('/', (req: Request, res: Response): void => {
    res.json({ message: "Hello World!" })
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})