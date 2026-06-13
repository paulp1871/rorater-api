import rateLimit from 'express-rate-limit'
import type { RateLimitRequestHandler } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../config/redis'

// Backing the limiter with Redis shares counters across instances, so an
// attacker cannot multiply their allowance by spreading requests over multiple
// app processes (the same reason sessions moved to Redis).
const createStore = (prefix: string): RedisStore =>
    new RedisStore({
        sendCommand: (...args: string[]) => redis.sendCommand(args),
        prefix,
    })

// Broad limiter applied to every request as a baseline against abuse and
// accidental request storms.
export const globalRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('rl:global:'),
    message: { error: 'Too many requests, please try again later' },
})

// Tighter limiter for authentication endpoints. Each /login also writes an
// oauth_state key to Redis, so this doubles as protection against state-store
// flooding.
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('rl:auth:'),
    message: { error: 'Too many authentication attempts, please try again later' },
})
