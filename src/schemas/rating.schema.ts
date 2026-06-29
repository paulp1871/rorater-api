import { z } from 'zod'
import { MAX_ROBLOX_USER_ID } from './roblox.schema'

export const ratedUserIdParamSchema = z.object({
    userId: z
        .string()
        .regex(/^\d+$/, 'User ID must be a positive integer')
        .transform((value) => BigInt(value))
        .refine(
            (value) => value >= 1n && value <= BigInt(MAX_ROBLOX_USER_ID),
            'User ID is out of range',
        ),
})

export type RatedUserIdParam = z.output<typeof ratedUserIdParamSchema>

export const ratingBodySchema = z.object({
    score: z
        .number({ error: 'A score is required' })
        .int('Score must be a whole number')
        .min(1, 'Score must be between 1 and 5')
        .max(5, 'Score must be between 1 and 5'),
})

export type RatingBody = z.output<typeof ratingBodySchema>
