import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z
  .object({ role: z.string().max(20).optional(), disabled: z.boolean().optional() })
  .refine((v) => v.role !== undefined || v.disabled !== undefined);

const STATUS: Record<string, number> = {
  invalid_role: 400,
  not_found: 404,
  self_change: 409,
  last_owner: 409,
};

/** Owner changes a member's role or disables/enables them. Sessions are revoked so it applies immediately. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ uid: string }> }): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;

  const body = await readJson(request, 1_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");

  const { uid } = await context.params;
  try {
    if (parsed.data.role !== undefined) {
      const setRole = await container.setStaffRole();
      const result = await setRole({ actorUid: owner.uid, uid, role: parsed.data.role });
      if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    }
    if (parsed.data.disabled !== undefined) {
      const setDisabled = await container.setStaffDisabled();
      const result = await setDisabled({ actorUid: owner.uid, uid, disabled: parsed.data.disabled });
      if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    }
    return success();
  } catch (error) {
    logError("staff_update_failed", error);
    return fail(500, "internal_error");
  }
}
