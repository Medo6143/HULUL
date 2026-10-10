import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { LEAD_STATUSES } from "@/features/leads";
import { container } from "@/lib/container";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.enum(LEAD_STATUSES),
  reason: z.string().trim().max(500).default(""),
});

const STATUS_FOR_CODE: Record<string, number> = {
  not_found: 404,
  transition_not_allowed: 409,
  reason_required: 400,
};

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code } }, { status });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const staff = await authorizeStaff(request);
  if (staff instanceof NextResponse) return staff;

  const raw = await request.text();
  if (raw.length > 2_000) return fail(413, "invalid_input");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  const { id } = await context.params;
  try {
    const change = await container.changeLeadStatus();
    const result = await change({
      leadId: id,
      to: parsed.data.to,
      by: staff.email || staff.uid,
      reason: parsed.data.reason,
    });
    if (!result.ok) return fail(STATUS_FOR_CODE[result.error.code] ?? 400, result.error.code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("lead_status_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
