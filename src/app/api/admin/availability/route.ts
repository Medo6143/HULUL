import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";

export const runtime = "nodejs";

const windowSchema = z.object({ start: z.string().max(5), end: z.string().max(5) });
const bodySchema = z.object({
  slotMinutes: z.number().int(),
  bufferMinutes: z.number().int(),
  minNoticeHours: z.number().int(),
  maxDaysAhead: z.number().int(),
  meetingLink: z.string().max(300),
  weekly: z.array(z.array(windowSchema).max(4)).length(7),
});

/** Owner sets the weekly schedule, slot length, notice, horizon and meeting link. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 8_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const save = await container.saveAvailability();
    const result = await save({ availability: parsed.data, updatedBy: owner.email || owner.uid });
    if (!result.ok) return fail(400, result.error.code);
    return success();
  } catch (error) {
    logError("availability_save_failed", error);
    return fail(500, "internal_error");
  }
}
