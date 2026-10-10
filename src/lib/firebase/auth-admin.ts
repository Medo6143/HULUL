import "server-only";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

type App = Parameters<typeof getAuth>[0];

export interface VerifiedToken {
  uid: string;
  email: string | null;
  name: string;
  /** Custom claim set by scripts/set-admin-claim.mjs: "owner" or "agent". */
  role: string | null;
  /** Seconds since epoch of the last sign-in. */
  authTime: number;
}

const toVerified = (decoded: DecodedIdToken): VerifiedToken => ({
  uid: decoded.uid,
  email: decoded.email ?? null,
  name: typeof decoded.name === "string" && decoded.name ? decoded.name : (decoded.email ?? decoded.uid),
  role: typeof decoded.role === "string" ? decoded.role : null,
  authTime: decoded.auth_time,
});

export function createAdminAuth(app: App) {
  const auth = getAuth(app);

  return {
    /** Rejects revoked or forged tokens. */
    async verifyIdToken(idToken: string): Promise<VerifiedToken> {
      return toVerified(await auth.verifyIdToken(idToken, true));
    },
    createSessionCookie(idToken: string, expiresInMs: number): Promise<string> {
      return auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    },
    async verifySessionCookie(cookie: string): Promise<VerifiedToken> {
      return toVerified(await auth.verifySessionCookie(cookie, true));
    },
  };
}
