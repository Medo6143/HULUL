import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ chatId: z.string().max(30) });
const byOwner = container.rateLimit("telegram-test", { limit: 10, windowMs: 10 * 60_000 });
const STATUS: Record<string, number> = { not_configured: 409, unknown_chat: 404, failed: 502 };

/** Owner sends a test message to one chat from the saved list. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  if (!(await byOwner(owner.uid))) return fail(429, "rate_limited");
  const body = await readJson(request, 500);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const sendTest = await container.sendTelegramTest();
    const result = await sendTest({ chatId: parsed.data.chatId, text: "رسالة تجريبية من لوحة تحكم حلول تك. لو وصلتك، إشعارات الطلبات الجديدة بتوصلك هنا." });
    if (!result.ok) return fail(STATUS[result.reason] ?? 400, result.reason);
    return success();
  } catch (error) {
    logError("telegram_test_failed", error);
    return fail(500, "internal_error");
  }
}
