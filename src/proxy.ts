import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const SESSION_COOKIE = "__hulol_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Cheap first gate: no cookie, no panel. The real check (signature, revocation, staff role) happens
    // on the server for every page and API call.
    const demo = process.env.NODE_ENV !== "production" && process.env.ADMIN_DEMO === "1";
    const isLogin = pathname === "/admin/login";
    if (!demo && !isLogin && !request.cookies.get(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
