type OAuthStateData = {
  codeVerifier: string;
  nonce: string;
  expiresAt: number;
};

const oauthStateStore = new Map<string, OAuthStateData>();

const STATE_EXPIRY_MS = 10 * 60 * 1000;

// Stores secrets associated with the public state value sent through Roblox.
export function saveOAuthState(
  state: string,
  codeVerifier: string,
  nonce: string
): void {
  oauthStateStore.set(state, {
    codeVerifier,
    nonce,
    expiresAt: Date.now() + STATE_EXPIRY_MS,
  });
}

// Callback state is consumed once so the same authorization response cannot
// be replayed.
export function getAndDeleteOAuthState(state: string): OAuthStateData | null {
  const data = oauthStateStore.get(state);

  oauthStateStore.delete(state);

  if (!data) {
    return null;
  }

  if (Date.now() > data.expiresAt) {
    return null;
  }

  return data;
}
