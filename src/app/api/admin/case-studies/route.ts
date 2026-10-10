import type { NextRequest, NextResponse } from "next/server";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../_lib/http";
import { refreshPublicContent } from "../_lib/revalidate";
import { SHOWCASE_STATUS, caseStudySchema } from "../_lib/showcase-schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 16_000);
  if (!body.ok) return body.response;
  const parsed = caseStudySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const save = await container.saveCaseStudy();
    const result = await save({ create: true, input: parsed.data });
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("case-studies");
    return success({ slug: result.value.slug }, 201);
  } catch (error) {
    logError("case_study_create_failed", error);
    return fail(500, "internal_error");
  }
}
