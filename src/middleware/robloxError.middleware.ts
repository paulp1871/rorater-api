import type { ErrorRequestHandler } from 'express'
import { RobloxRateLimitError } from '../errors/roblox.errors'

// Centralized error handler for failures originating from Roblox API calls.
// A rate-limit error is translated into a 429 (echoing Roblox's Retry-After hint
// when present) so callers can back off, rather than being flattened into the
// generic 502 used for every other upstream failure. Logging is intentionally
// left to the logging middleware (see logging.middleware.ts); this handler only
// shapes the response.
export const robloxErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (res.headersSent) {
        next(err)
        return
    }

    if (err instanceof RobloxRateLimitError) {
        if (err.retryAfterSeconds !== undefined) {
            res.setHeader('Retry-After', String(err.retryAfterSeconds))
        }
        res.status(429).json({ message: 'Roblox is rate limiting requests, please try again shortly' })
        return
    }

    res.status(502).json({ message: 'Unable to reach Roblox' })
}
