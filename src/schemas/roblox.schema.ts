import { z } from 'zod'

export const MAX_ROBLOX_USER_ID = Number.MAX_SAFE_INTEGER

export const userSearchQuerySchema = z.object({
    keyword: z
        .string({ error: 'A keyword query parameter is required' })
        .trim()
        .min(3, 'Not a valid ROBLOX username (minimum 3 characters)')
        .max(20, 'Not a valid ROBLOX username (maximum 20 characters)')
})

export type UserSearchQuery = z.output<typeof userSearchQuerySchema>

export const userIdParamSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive('User ID must be a positive integer')
        .max(MAX_ROBLOX_USER_ID, 'User ID is out of range'),
})

export type UserIdParam = z.output<typeof userIdParamSchema>
