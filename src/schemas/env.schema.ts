import { z } from 'zod'

export const envSchema = z.object({
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    REDIRECT_URI: z.url(),
    FRONTEND_URL: z.url(),
    SCOPES: z.string(),
    NODE_ENV: z.enum(['DEVELOPMENT', 'PRODUCTION', 'TEST']),
    PORT: z.string().transform(Number),
})
