import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { leadInputSchema, toNewLeadInput } from "@/features/leads";
import { container } from "@/lib/container";
import { verifyCaptcha } from "@/lib/recaptcha";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 20_000;
const byIp = container.rateLimit("leads-ip", { limit: 5, windowMs: 10 * 60_000 });
const byPhone = container.rateLimit("leads-phone", { limit: 3, windowMs: 60 * 60_000 });

const BOOKING_STATUS: Record<string, number> = {
  slot_taken: 409,
  slot_unavailable: 409,
  too_many_bookings: 429,
  invalid_date: 400,
  lead_failed: 400,
};

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code, message_key: `errors.lead.${code}` } }, { status });

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

  const parsed = leadInputSchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  // Honeypot: pretend success so bots learn nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const captcha = await verifyCaptcha({
    secret: container.env.APPCHECK_RECAPTCHA_SECRET,
    token: parsed.data.captcha,
    action: "lead",
  });
  if (!captcha.ok) {
    // The reason is logged on the server and sent back as a short code so a failing setup can be diagnosed.
    console.error("captcha_rejected", captcha.reason, captcha.detail);
    return NextResponse.json(
      { ok: false, error: { code: "bot_suspected", message_key: "errors.lead.bot_suspected", detail: captcha.detail } },
      { status: 403 },
    );
  }

  const input = toNewLeadInput(parsed.data);
  if (!(await byPhone(input.phone.replace(/\D/g, "")))) return fail(429, "rate_limited");

  const ipHash = createHash("sha256")
    .update(`${ip}:${container.env.RATE_LIMIT_SALT}`)
    .digest("hex");

  // A consultation with a chosen time is booked together with its lead.
  if (parsed.data.type === "consultation" && parsed.data.slotStartUtc) {
    try {
      const book = await container.requestConsultation();
      const result = await book({
        slotStartUtc: parsed.data.slotStartUtc,
        contact: { name: input.name, phone: input.phone, email: input.email, locale: input.locale },
        lead: { input, ipHash },
      });
      if (!result.ok) return fail(BOOKING_STATUS[result.error.code] ?? 400, result.error.code);
      return NextResponse.json(
        { ok: true, booking: { startUtc: result.value.startUtc.toISOString(), endUtc: result.value.endUtc.toISOString() } },
        { status: 201 },
      );
    } catch (error) {
      console.error("booking_failed", error instanceof Error ? error.message : "unknown");
      return fail(500, "internal_error");
    }
  }

  try {
    const createLead = await container.createLead();
    const result = await createLead({ input, ipHash });
    if (!result.ok) return fail(400, result.error.code);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("lead_create_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
