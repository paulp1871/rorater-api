import { createClient } from 'redis'
import { env } from './env'

export const redis = createClient({
    url: env.REDIS_URL,
    socket: {
        // Fail the initial connection attempt after 10s instead of hanging
        // startup indefinitely when Redis is unreachable.
        connectTimeout: 10_000,
        // Cap reconnect backoff so a flaky Redis doesn't retry in a tight loop,
        // but keep retrying (returning a delay) so transient outages recover.
        reconnectStrategy: (retries): number => Math.min(retries * 100, 3_000),
    },
})

redis.on('error', (err): void => {
    console.error('Redis client error', err)
})

export const connectRedis = async (): Promise<void> => {
    if (!redis.isOpen) {
        await redis.connect()
    }
}
