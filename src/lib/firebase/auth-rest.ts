import "server-only";

export type SignInResult =
  | { ok: true; idToken: string }
  | { ok: false; reason: "invalid_credentials" | "too_many_attempts" | "not_configured" | "failed" };

/**
 * Email and password sign-in through the Firebase Auth REST API, called from our server.
 * The password is passed straight through: it is never logged or stored here.
 */
export async function signInWithPassword(
  email: string,
  password: string,
  apiKey: string,
): Promise<SignInResult> {
  if (!apiKey) return { ok: false, reason: "not_configured" };

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        cache: "no-store",
      },
    );
    const data = (await response.json().catch(() => null)) as
      | { idToken?: string; error?: { message?: string } }
      | null;

    if (response.ok && data?.idToken) return { ok: true, idToken: data.idToken };

    const code = data?.error?.message ?? "";
    if (code.startsWith("TOO_MANY_ATTEMPTS")) return { ok: false, reason: "too_many_attempts" };
    if (/EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_LOGIN_CREDENTIALS|USER_DISABLED/.test(code)) {
      return { ok: false, reason: "invalid_credentials" };
    }
    return { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
