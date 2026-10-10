import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ password: z.string().max(200) });
const STATUS: Record<string, number> = { weak_password: 400, not_found: 404, self_change: 409 };

/** Owner sets a new password for another member. The member's sessions end, and the owner hands the password over. */
export async function POST(request: NextRequest, context: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 1_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { uid } = await context.params;
  try {
    const setPassword = await container.setStaffPassword();
    const result = await setPassword({ actorUid: owner.uid, uid, password: parsed.data.password });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success();
  } catch (error) {
    logError("staff_password_failed", error);
    return fail(500, "internal_error");
  }
}
