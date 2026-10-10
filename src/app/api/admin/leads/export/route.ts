import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAdminDemo, staffFromCookie } from "@/app/admin/_lib/staff";
import { leadsToCsv, toAdminLead } from "@/features/admin";
import { container } from "@/lib/container";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (isAdminDemo()) return NextResponse.json({ ok: false, error: { code: "forbidden" } }, { status: 403 });
  const staff = await staffFromCookie(request.cookies.get(SESSION_COOKIE)?.value);
  if (!staff) return NextResponse.json({ ok: false, error: { code: "unauthorized" } }, { status: 401 });

  try {
    const list = await container.listLeads();
    const csv = leadsToCsv((await list()).map(toAdminLead));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("lead_export_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false, error: { code: "internal_error" } }, { status: 500 });
  }
}
