import type { NextRequest, NextResponse } from "next/server";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";
import { refreshPublicContent } from "../../_lib/revalidate";
import { SHOWCASE_STATUS, caseStudySchema, publishSchema } from "../../_lib/showcase-schema";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 16_000);
  if (!body.ok) return body.response;
  const parsed = caseStudySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { slug } = await context.params;
  try {
    const save = await container.saveCaseStudy();
    // The slug is the document id and never changes after creation.
    const result = await save({ create: false, input: { ...parsed.data, slug } });
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("case-studies");
    return success();
  } catch (error) {
    logError("case_study_update_failed", error);
    return fail(500, "internal_error");
  }
}

export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 500);
  if (!body.ok) return body.response;
  const parsed = publishSchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { slug } = await context.params;
  try {
    const setPublished = await container.setCaseStudyPublished();
    const result = await setPublished({ slug, published: parsed.data.published });
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("case-studies");
    return success();
  } catch (error) {
    logError("case_study_publish_failed", error);
    return fail(500, "internal_error");
  }
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const { slug } = await context.params;
  try {
    const remove = await container.deleteCaseStudy();
    const result = await remove(slug);
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("case-studies");
    return success();
  } catch (error) {
    logError("case_study_delete_failed", error);
    return fail(500, "internal_error");
  }
}
