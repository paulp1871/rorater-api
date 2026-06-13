import { env } from './env'

// __Host- cookies cannot be scoped to another domain or path. Development uses
// plain names because browsers require __Host- cookies to also be Secure.
export const SESSION_COOKIE =
    env.NODE_ENV === 'production' ? '__Host-session' : 'session'
