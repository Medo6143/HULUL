import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { container } from "@/lib/container";

export const SESSION_COOKIE = "__hulol_session";
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;

export interface Staff {
  uid: string;
  email: string;
  name: string;
  role: "owner" | "agent";
}

/**
 * Local design preview with sample data. It only works outside production and only when ADMIN_DEMO=1,
 * so a deployed site can never expose the admin without a real session.
 */
export const isAdminDemo = (): boolean => process.env.NODE_ENV !== "production" && process.env.ADMIN_DEMO === "1";

const DEMO_STAFF: Staff = { uid: "demo", email: "demo@example.test", name: "مدير تجريبي", role: "owner" };

/** Verifies a session cookie value and the staff role claim. Returns null for anything invalid. */
export async function staffFromCookie(value: string | undefined): Promise<Staff | null> {
  if (!value) return null;
  try {
    const auth = await container.staffAuth();
    const verified = await auth.verifySessionCookie(value);
    if (verified.role !== "owner" && verified.role !== "agent") return null;
    return { uid: verified.uid, email: verified.email ?? "", name: verified.name, role: verified.role };
  } catch {
    return null;
  }
}

export async function getStaff(): Promise<Staff | null> {
  if (isAdminDemo()) return DEMO_STAFF;
  return staffFromCookie((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For server components and layouts: sends visitors without a valid staff session to the login page. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** For owner-only pages (team, availability, templates, settings). Agents are sent back to the leads list. */
export async function requireOwner(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "owner") redirect("/admin/leads");
  return staff;
}

const fail = (status: number, code: string) =>
  NextResponse.json({ ok: false, error: { code } }, { status });

/**
 * For API routes that change data. Requires a staff session and, for browser requests, a same-origin
 * `Origin` header (a second line of defence on top of the SameSite cookie).
 */
export async function authorizeStaff(request: NextRequest): Promise<Staff | NextResponse> {
  if (isAdminDemo()) return fail(403, "forbidden");

  const origin = request.headers.get("origin");
  if (origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === request.headers.get("host");
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) return fail(403, "forbidden");
  }

  const staff = await staffFromCookie(request.cookies.get(SESSION_COOKIE)?.value);
  if (!staff) return fail(401, "unauthorized");
  return staff;
}

/** Like authorizeStaff, but only the owner passes. Agents get 403. */
export async function authorizeOwner(request: NextRequest): Promise<Staff | NextResponse> {
  const staff = await authorizeStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (staff.role !== "owner") return fail(403, "forbidden");
  return staff;
}
