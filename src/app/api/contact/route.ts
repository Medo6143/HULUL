import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { contactInputSchema, toNewContactMessage } from "@/features/contact";
import { container } from "@/lib/container";
import { verifyCaptcha } from "@/lib/recaptcha";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;
const byIp = container.rateLimit("contact-ip", { limit: 5, windowMs: 10 * 60_000 });
const byEmail = container.rateLimit("contact-email", { limit: 3, windowMs: 60 * 60_000 });

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code, message_key: `errors.contact.${code}` } }, { status });

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "payload_too_large");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_json");
  }

  const ip = clientIp(request);
  if (!(await byIp(ip))) return fail(429, "rate_limited");

  const parsed = contactInputSchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  // Honeypot: pretend success so bots learn nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const captcha = await verifyCaptcha({
    secret: container.env.APPCHECK_RECAPTCHA_SECRET,
    token: parsed.data.captcha,
    action: "contact",
  });
  if (!captcha.ok) {
    console.error("captcha_rejected", captcha.reason, captcha.detail);
    return NextResponse.json({ ok: false, error: { code: "bot_suspected", detail: captcha.detail } }, { status: 403 });
  }

  const input = toNewContactMessage(parsed.data);
  if (!(await byEmail(input.email.toLowerCase()))) return fail(429, "rate_limited");

  const ipHash = createHash("sha256")
    .update(`${ip}:${container.env.RATE_LIMIT_SALT}`)
    .digest("hex");

  try {
    const send = await container.sendContactMessage();
    const result = await send({ input, ipHash });
    if (!result.ok) return fail(400, result.error.code);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("contact_send_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
