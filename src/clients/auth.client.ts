import { env } from '../config/env'
import {
    robloxTokenResponseSchema,
    type RobloxTokenResponse,
} from '../schemas/auth.schema'

const TOKEN_URL = 'https://apis.roblox.com/oauth/v1/token'
const ISSUER = 'https://apis.roblox.com/oauth/'
const CERTS_URL = 'https://apis.roblox.com/oauth/v1/certs'

// jose v6 is ESM-only; this project compiles to CommonJS, so load it via a
// cached dynamic import rather than a static import. Typing the module would
// require a 'resolution-mode' attribute under node16/CJS, so it stays untyped
// at this isolated boundary.
let josePromise: Promise<any> | null = null
const loadJose = (): Promise<any> => (josePromise ??= import('jose'))

// createRemoteJWKSet caches Roblox signing keys and refreshes them when Roblox
// rotates to an unknown key.
let jwks: any = null
const getJwks = async (): Promise<any> => {
    const jose = await loadJose()
    return (jwks ??= jose.createRemoteJWKSet(new URL(CERTS_URL)))
}

const postToTokenEndpoint = async (params: Record<string, string>): Promise<RobloxTokenResponse> => {
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Roblox token endpoint error: ${errorText}`)
    }

    return robloxTokenResponseSchema.parse(await response.json())
}

export const exchangeCodeForTokens = (
    code: string,
    codeVerifier: string,
): Promise<RobloxTokenResponse> =>
    postToTokenEndpoint({
        grant_type: 'authorization_code',
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        code,
        redirect_uri: env.REDIRECT_URI,
        code_verifier: codeVerifier,
    })

export const refreshAccessToken = async (
    refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number; refreshToken?: string }> => {
    const data = await postToTokenEndpoint({
        grant_type: 'refresh_token',
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        refresh_token: refreshToken,
    })
    return {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        ...(data.refresh_token !== undefined && { refreshToken: data.refresh_token }),
    }
}

export const verifyRobloxIdToken = async (
    idToken: string,
): Promise<unknown> => {
    const jose = await loadJose()
    const keySet = await getJwks()

    // jwtVerify checks the signature and standard time claims in addition to
    // the issuer and audience constraints configured here.
    const { payload } = await jose.jwtVerify(idToken, keySet, {
        issuer: ISSUER,
        audience: env.CLIENT_ID,
        algorithms: ['ES256'],
        requiredClaims: ['sub', 'exp', 'iat', 'nonce'],
    })

    // OIDC requires azp to identify this client when a token has multiple
    // audiences; when present for any token, it must still match this client.
    if (
        Array.isArray(payload.aud) &&
        payload.aud.length > 1 &&
        typeof payload.azp !== 'string'
    ) {
        throw new Error('Roblox ID token is missing an authorized party')
    }

    if (payload.azp !== undefined && payload.azp !== env.CLIENT_ID) {
        throw new Error('Invalid authorized party in Roblox ID token')
    }

    return payload
}
