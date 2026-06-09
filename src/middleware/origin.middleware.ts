import type { RequestHandler } from 'express'
import { env } from '../config/env'

const frontendOrigin = new URL(env.FRONTEND_URL).origin

// Cookie-authenticated mutations must originate from the configured frontend.
// This also rejects cross-site form posts, which CORS alone does not prevent.
export const requireFrontendOrigin: RequestHandler = (req, res, next) => {
    const requestOrigin = req.get('origin')

    if (requestOrigin !== frontendOrigin) {
        res.status(403).json({ error: 'Invalid request origin' })
        return
    }

    next()
}
