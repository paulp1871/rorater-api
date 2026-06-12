import { redis } from '../config/redis'

type OAuthStateData = {
    codeVerifier: string
    nonce: string
}

const STATE_EXPIRY_SECONDS = 10 * 60

const keyFor = (state: string): string => `oauth_state:${state}`

// Stores secrets associated with the public state value sent through Roblox.
export async function saveOAuthState(
    state: string,
    codeVerifier: string,
    nonce: string,
): Promise<void> {
    // Redis TTL expires the state for us, replacing the manual expiresAt check.
    await redis.set(keyFor(state), JSON.stringify({ codeVerifier, nonce }), {
        EX: STATE_EXPIRY_SECONDS,
    })
}

// Callback state is consumed once so the same authorization response cannot
// be replayed. GETDEL reads and deletes in a single atomic operation.
export async function getAndDeleteOAuthState(
    state: string,
): Promise<OAuthStateData | null> {
    const raw = await redis.getDel(keyFor(state))

    if (!raw) {
        return null
    }

    return JSON.parse(raw) as OAuthStateData
}
