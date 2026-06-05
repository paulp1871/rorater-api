import { app } from './app'

const PORT: Number = 3000

app.listen(PORT, (): void => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
