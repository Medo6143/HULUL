import type { NextRequest, NextResponse } from "next/server";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, success } from "../../../_lib/http";

export const runtime = "nodejs";

/** Owner emails a password-reset link to a member. The link only goes to the member's own address. */
export async function POST(request: NextRequest, context: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const { uid } = await context.params;
  try {
    const send = await container.resendInvite();
    const result = await send(uid, "reset");
    if (!result.ok) return fail(result.error.code === "not_found" ? 404 : 400, result.error.code);
    return success({ emailed: result.value.emailed });
  } catch (error) {
    logError("staff_reset_failed", error);
    return fail(500, "internal_error");
  }
}
