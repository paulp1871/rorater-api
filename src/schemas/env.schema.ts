import { z } from 'zod';

export const envSchema = z.object({
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    REDIRECT_URI: z.string(),
    FRONTEND_URL: z.string(),
    SCOPES: z.string(),
    NODE_ENV: z.enum(['DEVELOPMENT', 'PRODUCTION', 'TEST']).default('DEVELOPMENT'),
    PORT: z.string().transform(Number),
})