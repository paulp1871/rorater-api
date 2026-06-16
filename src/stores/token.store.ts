import { SESSION_MAX_AGE_MS } from '../config/cookies'
import { redis } from '../config/redis'
import type { RobloxTokens } from '../services/auth.service'

const TOKEN_EXPIRY_SECONDS = SESSION_MAX_AGE_MS / 1000

const tokenKey = (sessionId: string) => `roblox_token:session:${sessionId}`

export const saveTokens = async (sessionId: string, tokens: RobloxTokens): Promise<void> => {
    await redis.set(tokenKey(sessionId), JSON.stringify(tokens), { EX: TOKEN_EXPIRY_SECONDS })
}

export const getStoredTokens = async (sessionId: string): Promise<RobloxTokens | null> => {
    const raw = await redis.get(tokenKey(sessionId))
    return raw ? (JSON.parse(raw) as RobloxTokens) : null
}

// Overwrites the token record without resetting the TTL, so the key continues
// to expire at the time established when the session was created.
export const updateTokens = async (sessionId: string, tokens: RobloxTokens): Promise<void> => {
    await redis.set(tokenKey(sessionId), JSON.stringify(tokens), { KEEPTTL: true })
}

export const deleteTokens = async (sessionId: string): Promise<void> => {
    await redis.del(tokenKey(sessionId))
}
