import { redis } from '../config/redis'

export const SEARCH_TTL = 60
export const PROFILE_TTL = 5 * 60

export const searchCacheKey = (keyword: string) => `roblox:search:${keyword.toLowerCase()}`
export const profileCacheKey = (userId: number) => `roblox:profile:${userId}`

export const withCache = async <T>(
    key: string,
    ttlSeconds: number,
    fetch: () => Promise<T>,
): Promise<T> => {
    const raw = await redis.get(key)
    if (raw) return JSON.parse(raw) as T
    const result = await fetch()
    await redis.set(key, JSON.stringify(result), { EX: ttlSeconds })
    return result
}
