import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { leadInputSchema, toNewLeadInput } from "@/features/leads";
import { container } from "@/lib/container";
import { makeRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 20_000;
const byIp = makeRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const byPhone = makeRateLimiter({ limit: 3, windowMs: 60 * 60_000 });

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
  if (!byIp(ip)) return fail(429, "rate_limited");

  const parsed = leadInputSchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  // Honeypot: pretend success so bots learn nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const input = toNewLeadInput(parsed.data);
  if (!byPhone(input.phone.replace(/\D/g, ""))) return fail(429, "rate_limited");

  const ipHash = createHash("sha256")
    .update(`${ip}:${container.env.RATE_LIMIT_SALT}`)
    .digest("hex");

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
