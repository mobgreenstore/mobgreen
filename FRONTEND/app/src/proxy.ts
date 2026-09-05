import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  getAdminSessionCookieOptions,
} from "@/config/admin-session";

export function proxy(request: NextRequest) {
  const surface = process.env.MOB_GREENS_SURFACE;
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  // Public assets are shared by the two presentation servers. Redirecting
  // them to /admin made every locally hosted image (including partner logos)
  // return the admin page instead of the requested file.
  const isPublicAsset = pathname.startsWith("/images/");

  if (surface === "admin" && !isAdminPage && !isAdminApi && !isPublicAsset) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (surface === "store" && isAdminApi) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (surface === "store" && isAdminPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const response = NextResponse.next();
  if (surface === "admin" && isAdminPage && request.method === "GET") {
    const existingSession = request.cookies.get(ADMIN_SESSION_COOKIE_NAME);
    if (existingSession) {
      response.cookies.set(ADMIN_SESSION_COOKIE_NAME, existingSession.value, {
        ...getAdminSessionCookieOptions(),
        maxAge: ADMIN_SESSION_TTL_SECONDS,
      });
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
