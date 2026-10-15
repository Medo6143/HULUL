import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/lib/container";

export const runtime = "nodejs";

const byIp = container.rateLimit("survey-ip", { limit: 10, windowMs: 10 * 60_000 });
const byToken = container.rateLimit("survey-token", { limit: 5, windowMs: 60 * 60_000 });

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000),
  name: z.string().max(100).default(""),
  role: z.string().max(100).default(""),
  allowPublish: z.boolean().default(false),
  website: z.string().max(200).optional(),
});

const fail = (status: number, code: string) => NextResponse.json({ ok: false, error: { code } }, { status });
const STATUS: Record<string, number> = { invalid_rating: 400, comment_invalid: 400, not_found: 404, already_answered: 409 };

/** Public: the client sends their answer. The long random token in the link is the only credential needed. */
export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const raw = await request.text();
  if (raw.length > 5_000) return fail(413, "invalid_input");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await byIp(ip))) return fail(429, "rate_limited");
  const { token } = await context.params;
  if (!(await byToken(token))) return fail(429, "rate_limited");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");
  // Honeypot: pretend success so bots learn nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  try {
    const submit = await container.submitSurvey();
    const { website, ...answer } = parsed.data;
    void website;
    const result = await submit({ token, answer });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("survey_submit_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
