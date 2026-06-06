import { z } from 'zod'

export const userSearchQuerySchema = z.object({
    keyword: z
        .string({ error: 'A keyword query parameter is required' })
        .trim()
        .min(1, 'A keyword query parameter is required'),
})

export type UserSearchQuery = z.output<typeof userSearchQuerySchema>
