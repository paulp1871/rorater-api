// Base class for expected, client-facing application errors. Carrying an HTTP
// status lets appErrorHandler translate these into proper responses instead of
// the generic 502 that robloxErrorHandler falls back to for unknown errors.
export class AppError extends Error {
    readonly statusCode: number

    constructor(statusCode: number, message: string) {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
    }
}

export class SelfRatingError extends AppError {
    constructor() {
        super(400, 'You cannot rate yourself')
    }
}

export class RatingNotFoundError extends AppError {
    constructor() {
        super(404, 'No rating found to delete')
    }
}

export class RatedUserNotFoundError extends AppError {
    constructor() {
        super(404, 'That Roblox user does not exist')
    }
}
