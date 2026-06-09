import { env } from './config/env'
import { app } from './app'

const PORT = env.PORT || 3003

app.listen(PORT, (): void => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
