const TOKEN_KEY = "feedige_token";

/**
 * Minimal client-side token store (localStorage). Kept separate from `api.ts`
 * so the fetch wrapper can read the token without importing the auth feature.
 *
 * Note: localStorage is readable by XSS. For production, prefer an httpOnly
 * cookie — see the FE/BE decision logs.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}
