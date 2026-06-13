import type { Request, RequestHandler, Response } from 'express'
import { SESSION_COOKIE } from '../config/cookies'
import { env } from '../config/env'
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

const OAUTH_STATE_COOKIE =
    env.NODE_ENV === 'production' ? '__Host-oauth_state' : 'oauth_state'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const sessionCookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
} as const

export const startRobloxLogin = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const state = createRandomString()
    const nonce = createRandomString()
    const { codeVerifier, codeChallenge } = createPkcePair()

    // The cookie binds the callback to this browser, while the server record
    // keeps the verifier and nonce out of the browser.
    res.cookie(OAUTH_STATE_COOKIE, state, {
        ...sessionCookieOptions,
        maxAge: 10 * 60 * 1000,
    })
    await saveOAuthState(state, codeVerifier, nonce)

    const authorizationUrl = buildRobloxAuthorizationUrl({
        state,
        nonce,
        codeChallenge,
    })

    res.json({ authorizationUrl })
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
        const savedOAuthStateCookie = req.cookies?.[OAUTH_STATE_COOKIE]

        // OAuth transactions are single-use, even when Roblox returns an error.
        res.clearCookie(OAUTH_STATE_COOKIE, sessionCookieOptions)

        if (
            typeof savedOAuthStateCookie !== 'string' ||
            query.state !== savedOAuthStateCookie
        ) {
            res.redirect(`${env.FRONTEND_URL}/?auth_error=1`)
            return
        }

        // Reading deletes the server record to prevent callback replay.
        const savedOAuthState = await getAndDeleteOAuthState(query.state)

        if (!savedOAuthState) {
            res.redirect(`${env.FRONTEND_URL}/?auth_error=1`)
            return
        }

        if ('error' in query) {
            res.redirect(`${env.FRONTEND_URL}/?auth_error=1`)
            return
        }

        // Keep the current session alive until the replacement identity has
        // passed code exchange, ID-token verification, and nonce validation.
        const previousSessionId = req.cookies?.[SESSION_COOKIE]

        const robloxUser = await completeRobloxLogin(
            query.code,
            savedOAuthState.codeVerifier,
            savedOAuthState.nonce,
        )

        if (typeof previousSessionId === 'string') {
            await deleteSession(previousSessionId)
        }

        res.clearCookie(SESSION_COOKIE, sessionCookieOptions)

        const sessionId = await createSession(robloxUser)

        res.cookie(SESSION_COOKIE, sessionId, {
            ...sessionCookieOptions,
            maxAge: SESSION_MAX_AGE_MS,
        })

        res.redirect(env.FRONTEND_URL)
    } catch (error) {
        console.error(error)

        res.redirect(`${env.FRONTEND_URL}/?auth_error=1`)
    }
}

export const meHandler = async (
    req: Request,
    res: Response,
): Promise<void> => {
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

    res.json({ user })
}

export const logoutHandler = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const sessionId = req.cookies?.[SESSION_COOKIE]

    if (typeof sessionId === 'string') {
        await deleteSession(sessionId)
    }

    res.clearCookie(SESSION_COOKIE, sessionCookieOptions)
    res.status(204).end()
}
