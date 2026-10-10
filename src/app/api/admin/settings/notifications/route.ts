import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ recipients: z.array(z.string().max(200)).max(30) });

/** Owner replaces the list of addresses that receive alerts (new leads, messages, bookings). */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;

  const body = await readJson(request, 4_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");

  try {
    const save = await container.saveRecipients();
    const result = await save({ recipients: parsed.data.recipients, updatedBy: owner.email || owner.uid });
    if (!result.ok) return fail(400, result.error.code);
    return success({ recipients: result.value });
  } catch (error) {
    logError("recipients_save_failed", error);
    return fail(500, "internal_error");
  }
}
