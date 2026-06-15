import { z } from 'zod'

export const userSearchQuerySchema = z.object({
    keyword: z
        .string({ error: 'A keyword query parameter is required' })
        .trim()
        .min(3, 'Not a valid ROBLOX username (minimum 3 characters)')
        .max(20, 'Not a valid ROBLOX username (maximum 20 characters)')
})

export type UserSearchQuery = z.output<typeof userSearchQuerySchema>

export const userIdParamSchema = z.object({
    id: z.coerce.number().int().positive('User ID must be a positive integer'),
})

export type UserIdParam = z.output<typeof userIdParamSchema>
