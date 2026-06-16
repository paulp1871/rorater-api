// Thrown when an external Roblox API call comes back with HTTP 429. Carrying
// the retry hint here lets the error-handling middleware translate it into a
// proper 429 response with a Retry-After header instead of a generic 502.
export class RobloxRateLimitError extends Error {
    readonly retryAfterSeconds: number | undefined

    constructor(retryAfterSeconds?: number) {
        super('Roblox API rate limit exceeded')
        this.name = 'RobloxRateLimitError'
        this.retryAfterSeconds = retryAfterSeconds
    }
}
