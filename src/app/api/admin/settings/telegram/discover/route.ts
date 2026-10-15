import type { NextRequest, NextResponse } from "next/server";
import { authorizeOwner } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";
import { fail, logError, success } from "../../../_lib/http";

export const runtime = "nodejs";

/** Owner lists the people and groups that wrote to the bot and are not on the list yet. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const owner = await authorizeOwner(request);
  if (!("uid" in owner)) return owner;
  try {
    const discover = await container.discoverTelegramChats();
    const result = await discover();
    if (!result.ok) return fail(result.reason === "not_configured" ? 409 : 502, result.reason);
    return success({ chats: result.chats });
  } catch (error) {
    logError("telegram_discover_failed", error);
    return fail(500, "internal_error");
  }
}
