import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DASHBOARD_PATH: string = "/dashboard";
const LOGIN_PATH: string = "/login";
const REGISTER_PATH: string = "/register";
const ROOT_PATH: string = "/";
const AUTH_COOKIE_NAME: string = "accessToken";
const GUEST_ONLY_PATHS: readonly string[] = [LOGIN_PATH, REGISTER_PATH];

/**
 * Applies route protection and auth redirects based on session cookie.
 * @param {NextRequest} request - Incoming request
 * @returns {NextResponse} Next response or redirect
 */
export function proxy(request: NextRequest): NextResponse {
  const pathName: string = request.nextUrl.pathname;
  const hasSession: boolean = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathName === ROOT_PATH) {
    const destination: string = hasSession ? DASHBOARD_PATH : LOGIN_PATH;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathName.startsWith(DASHBOARD_PATH) && !hasSession) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  if (hasSession && GUEST_ONLY_PATHS.includes(pathName)) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register"],
};
