import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";

export const runtime = "nodejs";

const pair = (max: number) => z.object({ ar: z.string().max(max), en: z.string().max(max) });
const bodySchema = z.object({
  whatsapp: pair(1000),
  emailSubject: pair(150),
  emailBody: pair(4000),
});

/** Owner saves the invitation templates (WhatsApp and email, Arabic and English). */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 20_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const save = await container.saveTemplates();
    const result = await save({ templates: parsed.data, updatedBy: owner.email || owner.uid });
    if (!result.ok) return fail(400, result.error.code);
    return success();
  } catch (error) {
    logError("templates_save_failed", error);
    return fail(500, "internal_error");
  }
}
