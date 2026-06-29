export class RobloxRateLimitError extends Error {
    readonly retryAfterSeconds: number | undefined

    constructor(retryAfterSeconds?: number) {
        super('Roblox API rate limit exceeded')
        this.name = 'RobloxRateLimitError'
        this.retryAfterSeconds = retryAfterSeconds
    }
}

export class RobloxNotFoundError extends Error {
    constructor() {
        super('Roblox resource not found')
        this.name = 'RobloxNotFoundError'
    }
}
