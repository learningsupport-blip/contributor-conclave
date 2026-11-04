import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/cookie";

const PROTECTED = [/^\/student(?:\/|$)/, /^\/mentor(?:\/|$)/, /^\/admin(?:\/|$)/, /^\/superadmin(?:\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cc-path", pathname);
  requestHeaders.set("x-cc-method", request.method);
  requestHeaders.set("x-cc-start", String(Date.now()));

  const guarded = PROTECTED.some((pattern) => pattern.test(pathname));
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (guarded && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
