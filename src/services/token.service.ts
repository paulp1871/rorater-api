import { refreshAccessToken } from '../clients/auth.client'
import { getStoredTokens, updateTokens } from '../stores/token.store'

const REFRESH_BUFFER_MS = 60_000

export const getValidAccessToken = async (sessionId: string): Promise<string> => {
    const stored = await getStoredTokens(sessionId)

    if (!stored) {
        throw new Error('No tokens found — re-authentication required')
    }

    if (Date.now() < stored.expiresAt - REFRESH_BUFFER_MS) {
        return stored.accessToken
    }

    if (!stored.refreshToken) {
        throw new Error('Access token expired and no refresh token available — re-authentication required')
    }

    const refreshed = await refreshAccessToken(stored.refreshToken)
    await updateTokens(sessionId, { ...stored, ...refreshed })
    return refreshed.accessToken
}
