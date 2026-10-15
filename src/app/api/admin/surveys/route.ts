import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  projectSlug: z.string().max(60).default(""),
  projectTitle: z.object({ ar: z.string().max(140), en: z.string().max(140) }).optional(),
  clientName: z.string().max(100),
  clientPhone: z.string().max(30).default(""),
  clientEmail: z.string().max(200).default(""),
  locale: z.enum(["ar", "en"]),
});

const STATUS: Record<string, number> = { invalid_input: 400, invalid_phone: 400, invalid_email: 400 };

/** Staff create a survey link for one client and one project. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 4_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const create = await container.createSurvey();
    const result = await create({ input: parsed.data, by: staff.email || staff.uid });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success({ id: result.value.id }, 201);
  } catch (error) {
    logError("survey_create_failed", error);
    return fail(500, "internal_error");
  }
}
