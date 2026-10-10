import { NextResponse, type NextRequest } from "next/server";

/** Shared helpers for admin API routes: the `{ok:false,error:{code}}` shape and a size-capped JSON body reader. */
export const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code } }, { status });

export const success = (data: Record<string, unknown> = {}, status = 200) =>
  NextResponse.json({ ok: true, ...data }, { status });

export async function readJson(
  request: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; json: unknown } | { ok: false; response: NextResponse }> {
  const raw = await request.text();
  if (raw.length > maxBytes) return { ok: false, response: fail(413, "invalid_input") };
  try {
    return { ok: true, json: JSON.parse(raw) };
  } catch {
    return { ok: false, response: fail(400, "invalid_input") };
  }
}

export function logError(label: string, error: unknown): void {
  console.error(label, error instanceof Error ? error.message : "unknown");
}
