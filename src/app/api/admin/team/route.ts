import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { STAFF_ROLES } from "@/features/team";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().max(200),
  name: z.string().trim().max(100).default(""),
  role: z.enum(STAFF_ROLES),
});

const STATUS: Record<string, number> = { invalid_email: 400, invalid_role: 400, email_exists: 409 };

/** Owner invites a staff member. The invitee sets their own password through the emailed link. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;

  const body = await readJson(request, 2_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");

  try {
    const invite = await container.inviteStaff();
    const result = await invite(parsed.data);
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success({ emailed: result.value.emailed }, 201);
  } catch (error) {
    logError("staff_invite_failed", error);
    return fail(500, "internal_error");
  }
}
