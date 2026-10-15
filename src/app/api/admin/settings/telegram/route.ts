import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, readJson, success } from "../../_lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({ chats: z.array(z.object({ id: z.string().max(30), name: z.string().max(60).default("") })).max(30) });

/** Owner replaces the list of Telegram chats that receive new-lead, message, and booking alerts. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  const body = await readJson(request, 6_000);
  if (!body.ok) return body.response;
  const parsed = bodySchema.safeParse(body.json);
  if (!parsed.success) return fail(400, "invalid_input");
  try {
    const save = await container.saveTelegramChats();
    const result = await save({ chats: parsed.data.chats, updatedBy: owner.email || owner.uid });
    if (!result.ok) return fail(400, result.error.code);
    return success({ chats: result.value });
  } catch (error) {
    logError("telegram_chats_save_failed", error);
    return fail(500, "internal_error");
  }
}
