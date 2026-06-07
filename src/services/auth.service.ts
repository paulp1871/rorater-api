import crypto from 'node:crypto'
import { exchangeCodeForTokens, verifyRobloxIdToken } from '../clients/auth.client'
import { robloxIdTokenClaimsSchema } from '../schemas/auth.schema'
import { env } from '../config/env'

const AUTHORIZE_URL = 'https://apis.roblox.com/oauth/v1/authorize'

export type RobloxUser = {
    robloxUserId: string
    username?: string | undefined
    displayName?: string | undefined
}

export const createRandomString = (): string =>
    crypto.randomBytes(32).toString('base64url')

export const createPkcePair = (): {
    codeVerifier: string
    codeChallenge: string
} => {
    const codeVerifier = createRandomString()

    const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')

    return { codeVerifier, codeChallenge }
}

export const buildRobloxAuthorizationUrl = (params: {
    state: string
    nonce: string
    codeChallenge: string
}): string => {
    const url = new URL(AUTHORIZE_URL)

    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.CLIENT_ID)
    url.searchParams.set('redirect_uri', env.REDIRECT_URI)
    url.searchParams.set('scope', env.SCOPES)
    url.searchParams.set('state', params.state)
    url.searchParams.set('nonce', params.nonce)
    url.searchParams.set('code_challenge', params.codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')

    return url.toString()
}

export const completeRobloxLogin = async (
    code: string,
    codeVerifier: string,
    expectedNonce: string,
): Promise<RobloxUser> => {
    const tokens = await exchangeCodeForTokens(code, codeVerifier)
    const payload = await verifyRobloxIdToken(tokens.id_token)
    const claims = robloxIdTokenClaimsSchema.parse(payload)

    if (claims.nonce !== expectedNonce) {
        throw new Error('Invalid nonce in Roblox ID token')
    }

    return {
        robloxUserId: claims.sub,
        username: claims.preferred_username,
        displayName: claims.name,
    }
}
