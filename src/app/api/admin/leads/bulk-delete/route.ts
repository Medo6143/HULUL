import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ ids: z.array(z.string().min(1).max(100)).min(1).max(100) });

/** Owner deletes several leads at once (up to 100). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 10_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const remove = await container.deleteLeads();
    const result = await remove({ ids: parsed.data.ids });
    if (!result.ok) return fail(400, "invalid_input");
    return success({ deleted: result.value.deleted });
  } catch (error) {
    logError("leads_bulk_delete_failed", error);
    return fail(500, "internal_error");
  }
}
