import { z } from 'zod'

export const envSchema = z
    .object({
        CLIENT_ID: z.string(),
        CLIENT_SECRET: z.string(),
        REDIRECT_URI: z.url(),
        FRONTEND_URL: z.url(),
        SCOPES: z.string(),
        NODE_ENV: z.enum(['development', 'production', 'test']),
        PORT: z.string().transform(Number),
        REDIS_URL: z.string().min(1),
    })
    .superRefine((env, context) => {
        if (env.NODE_ENV !== 'production') {
            return
        }

        for (const field of ['REDIRECT_URI', 'FRONTEND_URL'] as const) {
            if (new URL(env[field]).protocol !== 'https:') {
                context.addIssue({
                    code: 'custom',
                    path: [field],
                    message: `${field} must use HTTPS in production`,
                })
            }
        }
    })
