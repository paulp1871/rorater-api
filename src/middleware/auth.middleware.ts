import type { RequestHandler } from 'express'
import { SESSION_COOKIE } from '../config/cookies'
import type { RobloxUser } from '../services/auth.service'
import { getSession } from '../stores/session.store'

export interface SessionLocals {
    user: RobloxUser
}

export const requireSession: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals
> = async (req, res, next) => {
    const sessionId = req.cookies?.[SESSION_COOKIE]

    if (typeof sessionId !== 'string') {
        res.status(401).json({ error: 'Not authenticated' })
        return
    }

    const user = await getSession(sessionId)

    if (!user) {
        res.status(401).json({ error: 'Not authenticated' })
        return
    }

    res.locals.user = user
    next()
}
