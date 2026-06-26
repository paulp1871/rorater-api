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
        DATABASE_URL: z.string().min(1),
        DIRECT_URL: z.string().min(1)
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

        // Redis holds plaintext OAuth access/refresh tokens, so the transport
        // must be encrypted in production. node-redis uses the rediss:// scheme
        // to enable TLS.
        let redisProtocol: string | undefined
        try {
            redisProtocol = new URL(env.REDIS_URL).protocol
        } catch {
            context.addIssue({
                code: 'custom',
                path: ['REDIS_URL'],
                message: 'REDIS_URL must be a valid URL',
            })
        }

        if (redisProtocol !== undefined && redisProtocol !== 'rediss:') {
            context.addIssue({
                code: 'custom',
                path: ['REDIS_URL'],
                message: 'REDIS_URL must use TLS (rediss://) in production',
            })
        }
    })
