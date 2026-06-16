import type { Request, RequestHandler, Response } from 'express'
import {
    cookieOptions,
    OAUTH_STATE_COOKIE,
    SESSION_COOKIE,
    SESSION_MAX_AGE_MS,
} from '../config/cookies'
import { env } from '../config/env'
import type { SessionLocals } from '../middleware/auth.middleware'
import type { ValidatedQueryLocals } from '../middleware/validation.middleware'
import type { RobloxCallbackQuery } from '../schemas/auth.schema'
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
import { createSession, deleteSession } from '../stores/session.store'
import { deleteTokens, saveTokens } from '../stores/token.store'
import { upsertUser } from '../db/user.db'

const AUTH_ERROR_URL = `${env.FRONTEND_URL}/?auth_error=1`

export const startRobloxLogin = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const state = createRandomString()
    const nonce = createRandomString()
    const { codeVerifier, codeChallenge } = createPkcePair()

    await saveOAuthState(state, codeVerifier, nonce)

    res.cookie(OAUTH_STATE_COOKIE, state, {
        ...cookieOptions,
        maxAge: 10 * 60 * 1000,
    })

    const authorizationUrl = buildRobloxAuthorizationUrl({ state, nonce, codeChallenge })
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
        res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions)

        if (
            typeof savedOAuthStateCookie !== 'string' ||
            query.state !== savedOAuthStateCookie ||
            'error' in query
        ) {
            res.redirect(AUTH_ERROR_URL)
            return
        }

        // Reading deletes the server record to prevent callback replay.
        const savedOAuthState = await getAndDeleteOAuthState(query.state)

        if (!savedOAuthState) {
            res.redirect(AUTH_ERROR_URL)
            return
        }

        // Keep the current session alive until the replacement identity has
        // passed code exchange, ID-token verification, and nonce validation.
        const previousSessionId = req.cookies?.[SESSION_COOKIE]

        const { user: robloxUser, tokens } = await completeRobloxLogin(
            query.code,
            savedOAuthState.codeVerifier,
            savedOAuthState.nonce,
        )

        // createSession runs alongside upsertUser so we have a sessionId to key
        // the token record. The old session is deleted only after all of this
        // succeeds, so a crash mid-login leaves the previous session intact.
        const [sessionId] = await Promise.all([
            createSession(robloxUser),
            upsertUser(BigInt(robloxUser.robloxUserId)),
        ])

        await saveTokens(sessionId, tokens)

        if (typeof previousSessionId === 'string') {
            await Promise.all([deleteSession(previousSessionId), deleteTokens(previousSessionId)])
        }

        res.clearCookie(SESSION_COOKIE, cookieOptions)

        res.cookie(SESSION_COOKIE, sessionId, {
            ...cookieOptions,
            maxAge: SESSION_MAX_AGE_MS,
        })

        res.redirect(env.FRONTEND_URL)
    } catch (error) {
        console.error(error)
        res.redirect(AUTH_ERROR_URL)
    }
}

export const meHandler: RequestHandler<
    Record<string, string>,
    unknown,
    unknown,
    unknown,
    SessionLocals
> = (req, res) => {
    res.json({ user: res.locals.user })
}

export const logoutHandler = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const sessionId = req.cookies?.[SESSION_COOKIE]

    if (typeof sessionId === 'string') {
        await Promise.all([deleteSession(sessionId), deleteTokens(sessionId)])
    }

    res.clearCookie(SESSION_COOKIE, cookieOptions)
    res.status(204).end()
}
