import { z } from 'zod'

// Roblox user IDs can exceed Number.MAX_SAFE_INTEGER, so the rated user id is
// kept as a BigInt rather than coerced to a number (unlike userIdParamSchema).
// The raw param is matched as a digit string, then parsed to BigInt.
export const ratedUserIdParamSchema = z.object({
    userId: z
        .string()
        .regex(/^\d+$/, 'User ID must be a positive integer')
        .transform((value) => BigInt(value)),
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
