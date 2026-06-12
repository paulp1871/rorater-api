import crypto from 'node:crypto'
import { redis } from '../config/redis'
import type { RobloxUser } from '../services/auth.service'

const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60

const keyFor = (sessionId: string): string => `session:${sessionId}`

export const createSession = async (user: RobloxUser): Promise<string> => {
    // The browser receives only this opaque identifier; user data stays in the
    // server-side session store.
    const sessionId = crypto.randomBytes(32).toString('hex')

    // Redis TTL expires the session for us, replacing the manual expiresAt check.
    await redis.set(keyFor(sessionId), JSON.stringify(user), {
        EX: SESSION_EXPIRY_SECONDS,
    })

    return sessionId
}

export const getSession = async (
    sessionId: string,
): Promise<RobloxUser | null> => {
    const raw = await redis.get(keyFor(sessionId))

    if (!raw) {
        return null
    }

    return JSON.parse(raw) as RobloxUser
}

export const deleteSession = async (sessionId: string): Promise<void> => {
    await redis.del(keyFor(sessionId))
}
