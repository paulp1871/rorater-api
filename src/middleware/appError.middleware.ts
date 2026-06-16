import type { ErrorRequestHandler } from 'express'
import { AppError } from '../errors/rating.errors'

// Translates expected application errors (AppError subclasses) into their
// declared HTTP status. Registered before robloxErrorHandler so these are not
// flattened into the generic 502; anything that is not an AppError is passed
// along untouched. Logging is left to the logging middleware.
export const appErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent || !(err instanceof AppError)) {
        next(err)
        return
    }

    res.status(err.statusCode).json({ message: err.message })
}
