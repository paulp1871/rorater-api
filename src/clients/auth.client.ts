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

let jwks: any = null
const getJwks = async (): Promise<any> => {
    const jose = await loadJose()
    return (jwks ??= jose.createRemoteJWKSet(new URL(CERTS_URL)))
}

export const exchangeCodeForTokens = async (
    code: string,
    codeVerifier: string,
): Promise<RobloxTokenResponse> => {
    const body = new URLSearchParams()

    body.set('grant_type', 'authorization_code')
    body.set('client_id', env.CLIENT_ID)
    body.set('client_secret', env.CLIENT_SECRET)
    body.set('code', code)
    body.set('redirect_uri', env.REDIRECT_URI)
    body.set('code_verifier', codeVerifier)

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to exchange Roblox code: ${errorText}`)
    }

    return robloxTokenResponseSchema.parse(await response.json())
}

export const verifyRobloxIdToken = async (
    idToken: string,
): Promise<unknown> => {
    const jose = await loadJose()
    const keySet = await getJwks()

    const { payload } = await jose.jwtVerify(idToken, keySet, {
        issuer: ISSUER,
        audience: env.CLIENT_ID,
    })

    return payload
}
