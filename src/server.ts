import { env } from './config/env'
import { connectRedis } from './config/redis'
import { app } from './app'

const PORT = env.PORT || 3003

const main = async (): Promise<void> => {
    // Fail fast if Redis is unreachable rather than serving requests that
    // cannot read or write sessions.
    await connectRedis()

    app.listen(PORT, (): void => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}

main().catch((error): void => {
    console.error('Failed to start server', error)
    process.exit(1)
})
