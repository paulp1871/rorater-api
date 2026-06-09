import crypto from 'node:crypto'
import type { RobloxUser } from '../services/auth.service'

type SessionData = {
    user: RobloxUser
    createdAt: number
    expiresAt: number
}

const sessionStore = new Map<string, SessionData>()

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

export const createSession = (user: RobloxUser): string => {
    // The browser receives only this opaque identifier; user data stays in the
    // server-side session store.
    const sessionId = crypto.randomBytes(32).toString('hex')
    const now = Date.now()

    sessionStore.set(sessionId, {
        user,
        createdAt: now,
        expiresAt: now + SESSION_EXPIRY_MS,
    })

    return sessionId
}

export const getSession = (sessionId: string): RobloxUser | null => {
    const data = sessionStore.get(sessionId)

    if (!data) {
        return null
    }

    if (Date.now() > data.expiresAt) {
        sessionStore.delete(sessionId)
        return null
    }

    return data.user
}

export const deleteSession = (sessionId: string): void => {
    sessionStore.delete(sessionId)
}
