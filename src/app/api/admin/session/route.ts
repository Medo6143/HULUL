import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { makeRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const byIp = makeRateLimiter({ limit: 10, windowMs: 10 * 60_000 });
const byEmail = makeRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code } }, { status });

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Signs a staff member in. Only accounts with the owner or agent claim get a session. */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 2_000) return fail(413, "invalid_input");

  const ip = clientIp(request);
  if (!byIp(ip)) return fail(429, "too_many_attempts");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  const { email, password } = parsed.data;
  if (!byEmail(createHash("sha256").update(email.toLowerCase()).digest("hex"))) {
    return fail(429, "too_many_attempts");
  }

  try {
    const auth = await container.staffAuth();
    const signedIn = await auth.signIn(email, password);
    if (!signedIn.ok) {
      if (signedIn.reason === "not_configured") return fail(503, "not_configured");
      if (signedIn.reason === "too_many_attempts") return fail(429, "too_many_attempts");
      return fail(401, signedIn.reason === "invalid_credentials" ? "invalid_credentials" : "internal_error");
    }

    const verified = await auth.verifyIdToken(signedIn.idToken);
    if (verified.role !== "owner" && verified.role !== "agent") return fail(403, "forbidden");

    const cookie = await auth.createSessionCookie(signedIn.idToken, SESSION_MAX_AGE_SECONDS * 1000);
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: cookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("staff_sign_in_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
