import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { container } from "@/lib/container";

export const runtime = "nodejs";

const byCancelIp = container.rateLimit("cancel-ip", { limit: 10, windowMs: 10 * 60_000 });
const bodySchema = z.object({ id: z.string().min(1).max(100), token: z.string().min(1).max(200) });

const fail = (status: number, code: string) => NextResponse.json({ ok: false, error: { code } }, { status });
const STATUS: Record<string, number> = { invalid_token: 403, already_cancelled: 409, not_allowed: 409 };

/** Public: the customer cancels with the id and token from their confirmation email. */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 1_000) return fail(413, "invalid_input");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await byCancelIp(ip))) return fail(429, "rate_limited");

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  try {
    const cancel = await container.cancelBooking();
    const result = await cancel(parsed.data);
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("cancel_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
