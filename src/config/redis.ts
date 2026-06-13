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

// Begin connecting as soon as this module is imported. Module evaluation
// happens before main() runs, so anything constructed during import (the
// rate-limit Redis store) would otherwise send commands to a still-closed
// client. Kicking off the connection here puts the client into the
// "connecting" state, where node-redis queues those commands until ready.
const connectionPromise = redis.connect()

// connectRedis returns the single shared connection promise so server startup
// still awaits the real connection and fails fast if it rejects.
export const connectRedis = (): Promise<unknown> => connectionPromise
