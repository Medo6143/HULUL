import { revalidateTag } from "next/cache";
import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { SOCIAL_KEYS } from "@/features/site-settings";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  whatsappNumber: z.string().max(40).default(""),
  phoneDisplay: z.string().max(40).default(""),
  email: z.string().max(200).default(""),
  socials: z.record(z.enum(SOCIAL_KEYS), z.string().max(300)).default({}),
});

/** Owner edits the public phone, WhatsApp number, email, and social links. The site updates right away. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 8_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const save = await container.saveSiteSettings();
    const result = await save({ settings: parsed.data, updatedBy: owner.email || owner.uid });
    if (!result.ok) {
      const field = result.error.code === "invalid_url" ? result.error.field : undefined;
      return Response.json({ ok: false, error: { code: result.error.code, ...(field ? { field } : {}) } }, { status: 400 }) as NextResponse;
    }
    revalidateTag("site-settings", { expire: 0 });
    return success();
  } catch (error) {
    logError("site_settings_save_failed", error);
    return fail(500, "internal_error");
  }
}
