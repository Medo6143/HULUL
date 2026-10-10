import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  closed: z.boolean(),
  windows: z.array(z.object({ start: z.string().max(5), end: z.string().max(5) })).max(4).default([]),
});

type Context = { params: Promise<{ date: string }> };

/** Owner closes a day or sets special hours for it. */
export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 2_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  const { date } = await context.params;
  try {
    const save = await container.saveException();
    const result = await save({ date, ...parsed.data });
    if (!result.ok) return fail(400, result.error.code);
    return success();
  } catch (error) {
    logError("availability_exception_failed", error);
    return fail(500, "internal_error");
  }
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const { date } = await context.params;
  try {
    const remove = await container.deleteException();
    const result = await remove(date);
    if (!result.ok) return fail(400, result.error.code);
    return success();
  } catch (error) {
    logError("availability_exception_delete_failed", error);
    return fail(500, "internal_error");
  }
}
