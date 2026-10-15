import type { NextRequest, NextResponse } from "next/server";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, success } from "../../_lib/http";

export const runtime = "nodejs";

/** Owner deletes a survey with its answer. A testimonial already made from it stays. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const { id } = await context.params;
  try {
    const remove = await container.deleteSurvey();
    const result = await remove(id);
    if (!result.ok) return fail(404, result.error.code);
    return success();
  } catch (error) {
    logError("survey_delete_failed", error);
    return fail(500, "internal_error");
  }
}
