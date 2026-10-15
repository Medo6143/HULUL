import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner, authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().max(100),
  phone: z.string().max(30),
  email: z.string().max(200).default(""),
  service: z.enum(["web", "mobile", "design", "unsure"]),
  preferredContact: z.enum(["whatsapp", "call", "email"]),
  businessType: z.string().max(100).default(""),
  timeline: z.string().max(40).default(""),
  description: z.string().max(2000).default(""),
});

const STATUS: Record<string, number> = { invalid_name: 400, invalid_phone: 400, invalid_email: 400, not_found: 404 };

/** Staff correct a lead's contact and request details. */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 8_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { id } = await context.params;
  try {
    const update = await container.updateLeadDetails();
    const result = await update({ leadId: id, patch: parsed.data });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success();
  } catch (error) {
    logError("lead_update_failed", error);
    return fail(500, "internal_error");
  }
}

/** Owner deletes one lead for good, with its notes, history, and consent records. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const { id } = await context.params;
  try {
    const remove = await container.deleteLeads();
    const result = await remove({ ids: [id] });
    if (!result.ok || result.value.deleted === 0) return fail(404, "not_found");
    return success();
  } catch (error) {
    logError("lead_delete_failed", error);
    return fail(500, "internal_error");
  }
}
