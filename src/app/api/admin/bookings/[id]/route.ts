import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ status: z.string().max(20) });
const STATUS: Record<string, number> = { not_found: 404, not_allowed: 409 };

/** Staff marks a booking completed, no-show, or cancelled (cancelling frees the time and emails the customer). */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 500);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { id } = await context.params;
  try {
    const setStatus = await container.setBookingStatus();
    const result = await setStatus({ id, status: parsed.data.status });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success();
  } catch (error) {
    logError("booking_status_failed", error);
    return fail(500, "internal_error");
  }
}
