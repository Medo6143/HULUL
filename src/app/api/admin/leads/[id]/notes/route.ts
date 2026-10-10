import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { container } from "@/lib/container";

export const runtime = "nodejs";

const bodySchema = z.object({ text: z.string().min(1).max(5_000) });

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code } }, { status });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const staff = await authorizeStaff(request);
  if (staff instanceof NextResponse) return staff;

  const raw = await request.text();
  if (raw.length > 8_000) return fail(413, "invalid_input");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "invalid_input");

  const { id } = await context.params;
  try {
    const add = await container.addLeadNote();
    const result = await add({
      leadId: id,
      authorUid: staff.uid,
      authorName: staff.name,
      text: parsed.data.text,
    });
    if (!result.ok) {
      return fail(result.error.code === "not_found" ? 404 : 400, result.error.code);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("lead_note_failed", error instanceof Error ? error.message : "unknown");
    return fail(500, "internal_error");
  }
}
