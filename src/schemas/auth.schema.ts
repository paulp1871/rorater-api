import { z } from 'zod'

const robloxCallbackSuccessSchema = z.object({
    code: z
        .string({ error: 'Missing code from Roblox callback' })
        .min(1, 'Missing code from Roblox callback'),
    state: z
        .string({ error: 'Missing state from Roblox callback' })
        .min(1, 'Missing state from Roblox callback'),
})

const robloxCallbackErrorSchema = z.object({
    error: z.string().min(1),
    error_description: z.string().optional(),
    state: z
        .string({ error: 'Missing state from Roblox callback' })
        .min(1, 'Missing state from Roblox callback'),
})

// Roblox redirects back with either ?code&state (success) or ?error (e.g. the
// user denied consent). Accept both so the controller can surface the error.
export const robloxCallbackQuerySchema = z.union([
    robloxCallbackSuccessSchema,
    robloxCallbackErrorSchema,
])

export type RobloxCallbackQuery = z.output<typeof robloxCallbackQuerySchema>

export const robloxTokenResponseSchema = z.object({
    access_token: z.string(),
    id_token: z.string(),
    refresh_token: z.string().optional(),
    expires_in: z.number(),
    token_type: z.string(),
})

export type RobloxTokenResponse = z.output<typeof robloxTokenResponseSchema>

export const robloxIdTokenClaimsSchema = z.object({
    sub: z.string(),
    nonce: z.string(),
    preferred_username: z.string().optional(),
    name: z.string().optional(),
    picture: z.url().nullable().optional(),
})

export type RobloxIdTokenClaims = z.output<typeof robloxIdTokenClaimsSchema>
