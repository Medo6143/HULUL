import { NextResponse, type NextRequest } from "next/server";
import { container } from "@/lib/container";

export const runtime = "nodejs";

const bySlotsIp = container.rateLimit("slots-ip", { limit: 40, windowMs: 60_000 });

/** Public: the open consultation times only. It never includes who booked what. */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await bySlotsIp(ip))) return NextResponse.json({ ok: false, error: { code: "rate_limited" } }, { status: 429 });

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? undefined;
  const days = Number(params.get("days") ?? "14");
  try {
    const getSlots = await container.getAvailableSlots();
    const result = await getSlots({ from: from || undefined, days: Number.isFinite(days) ? days : 14 });
    if (!result.ok) return NextResponse.json({ ok: false, error: { code: result.error.code } }, { status: 400 });
    return NextResponse.json({ ok: true, days: result.value }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("slots_failed", error instanceof Error ? error.message : "unknown");
    // The form works without times, so a failure here is reported as "no times" rather than an error page.
    return NextResponse.json({ ok: true, days: [] });
  }
}
