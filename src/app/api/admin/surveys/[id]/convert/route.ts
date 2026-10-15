import type { NextRequest, NextResponse } from "next/server";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, success } from "../../../_lib/http";

export const runtime = "nodejs";

const STATUS: Record<string, number> = { not_found: 404, not_answered: 409, consent_missing: 422, already_converted: 409, invalid_input: 400 };

/** Staff turn an approved answer into a draft testimonial (never published automatically). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const { id } = await context.params;
  try {
    const convert = await container.convertSurvey();
    const result = await convert(id);
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success({ testimonialId: result.value.testimonialId });
  } catch (error) {
    logError("survey_convert_failed", error);
    return fail(500, "internal_error");
  }
}
