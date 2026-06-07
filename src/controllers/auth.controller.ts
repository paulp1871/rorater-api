import type { Request, RequestHandler, Response } from 'express'
import {
    buildRobloxAuthorizationUrl,
    completeRobloxLogin,
    createPkcePair,
    createRandomString,
} from '../services/auth.service'
import {
    getAndDeleteOAuthState,
    saveOAuthState,
} from '../stores/auth.store'
import {
    createSession,
    deleteSession,
    getSession,
} from '../stores/session.store'
import type { ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { RobloxCallbackQuery } from '../schemas/auth.schema'
import { env } from '../config/env'

const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const sessionCookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'PRODUCTION',
    sameSite: 'lax',
} as const

export const startRobloxLogin = (req: Request, res: Response): void => {
    const state = createRandomString()
    const nonce = createRandomString()
    const { codeVerifier, codeChallenge } = createPkcePair()

    saveOAuthState(state, codeVerifier, nonce)

    const authorizationUrl = buildRobloxAuthorizationUrl({
        state,
        nonce,
        codeChallenge,
    })

    res.redirect(authorizationUrl)
}

export const handleRobloxCallback: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    ValidatedQueryLocals<RobloxCallbackQuery>
> = async (req, res) => {
    try {
        const query = res.locals.validatedQuery

        if ('error' in query) {
            res.status(400).json({
                message: 'Roblox OAuth error',
                error: query.error,
                error_description: query.error_description,
            })
            return
        }

        const { code, state } = query

        const savedOAuthState = getAndDeleteOAuthState(state)

        if (!savedOAuthState) {
            res.status(400).json({
                message: 'Invalid or expired OAuth state',
            })
            return
        }

        const robloxUser = await completeRobloxLogin(
            code,
            savedOAuthState.codeVerifier,
            savedOAuthState.nonce,
        )

        const sessionId = createSession(robloxUser)

        res.cookie(SESSION_COOKIE, sessionId, {
            ...sessionCookieOptions,
            maxAge: SESSION_MAX_AGE_MS,
        })

        res.redirect(`${env.FRONTEND_URL}/dashboard`)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Failed to complete Roblox login',
        })
    }
}

export const meHandler = (req: Request, res: Response): void => {
    const sessionId = req.cookies?.[SESSION_COOKIE]

    if (typeof sessionId !== 'string') {
        res.status(401).json({ message: 'Not authenticated' })
        return
    }

    const user = getSession(sessionId)

    if (!user) {
        res.status(401).json({ message: 'Not authenticated' })
        return
    }

    res.json({ user })
}

export const logoutHandler = (req: Request, res: Response): void => {
    const sessionId = req.cookies?.[SESSION_COOKIE]

    if (typeof sessionId === 'string') {
        deleteSession(sessionId)
    }

    res.clearCookie(SESSION_COOKIE, sessionCookieOptions)
    res.status(204).end()
}
