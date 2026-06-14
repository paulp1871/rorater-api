import { env } from './env'

const isProduction = env.NODE_ENV === 'production'

// __Host- cookies cannot be scoped to another domain or path. Development uses
// plain names because browsers require __Host- cookies to also be Secure.
export const SESSION_COOKIE = isProduction ? '__Host-session' : 'session'
export const OAUTH_STATE_COOKIE = isProduction ? '__Host-oauth_state' : 'oauth_state'

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
} as const
