import type { NextRequest, NextResponse } from "next/server";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";
import { refreshPublicContent } from "../../_lib/revalidate";
import { SHOWCASE_STATUS, publishSchema, testimonialSchema } from "../../_lib/showcase-schema";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 8_000);
  if (!body.ok) return body.response;
  const parsed = testimonialSchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { id } = await context.params;
  try {
    const save = await container.saveTestimonial();
    const result = await save({ id, input: parsed.data });
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("testimonials");
    return success();
  } catch (error) {
    logError("testimonial_update_failed", error);
    return fail(500, "internal_error");
  }
}

/** Publish or unpublish. Publishing without a recorded consent is refused (422 consent_required). */
export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const body = await readJson(request, 500);
  if (!body.ok) return body.response;
  const parsed = publishSchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { id } = await context.params;
  try {
    const setPublished = await container.setTestimonialPublished();
    const result = await setPublished({ id, published: parsed.data.published });
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("testimonials");
    return success();
  } catch (error) {
    logError("testimonial_publish_failed", error);
    return fail(500, "internal_error");
  }
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  const { id } = await context.params;
  try {
    const remove = await container.deleteTestimonial();
    const result = await remove(id);
    if (!result.ok) return fail(SHOWCASE_STATUS[result.error.code] ?? 400, result.error.code);
    refreshPublicContent("testimonials");
    return success();
  } catch (error) {
    logError("testimonial_delete_failed", error);
    return fail(500, "internal_error");
  }
}
