import { z } from 'zod'

// Shared query for both leaderboard endpoints. limit is coerced from the query
// string and clamped to a sane range so a caller can't request an unbounded page.
export const leaderboardQuerySchema = z.object({
    limit: z.coerce
        .number({ error: 'limit must be a number' })
        .int('limit must be a whole number')
        .min(1, 'limit must be between 1 and 50')
        .max(50, 'limit must be between 1 and 50')
        .default(20),
})

export type LeaderboardQuery = z.output<typeof leaderboardQuerySchema>
