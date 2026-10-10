import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ subject: z.string().max(150), body: z.string().max(4000) });
const STATUS: Record<string, number> = { invalid_input: 400, not_found: 404, no_email: 422, send_failed: 502 };

/** Staff sends the consultation invitation by email to the lead's own address. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 10_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { id } = await context.params;
  try {
    const send = await container.sendInviteEmail();
    const result = await send({ leadId: id, subject: parsed.data.subject, body: parsed.data.body });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success();
  } catch (error) {
    logError("invite_email_failed", error);
    return fail(500, "internal_error");
  }
}
