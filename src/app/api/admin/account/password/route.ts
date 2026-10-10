import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ current: z.string().min(1).max(200), next: z.string().max(200) });
const STATUS: Record<string, number> = { weak_password: 400, wrong_password: 403, too_many_attempts: 429 };
const byAccount = container.rateLimit("password-change", { limit: 5, windowMs: 15 * 60_000 });

/** Any signed-in member changes their own password. All their sessions end afterwards, so they sign in again. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;
  if (!(await byAccount(staff.uid))) return fail(429, "too_many_attempts");
  const body = await readJson(request, 1_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const change = await container.changeOwnPassword();
    const result = await change({ uid: staff.uid, email: staff.email, current: parsed.data.current, next: parsed.data.next });
    if (!result.ok) return fail(STATUS[result.error.code] ?? 400, result.error.code);
    return success();
  } catch (error) {
    logError("password_change_failed", error);
    return fail(500, "internal_error");
  }
}
