import { NextResponse } from "next/server";
import { auth } from "./auth";
import { getDefaultPathForRole, getRoutePermission, hasPermission } from "./lib/permissions";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(getDefaultPathForRole(req.auth?.user?.role), req.url));
  }

  if (isLoggedIn) {
    const requiredPermission = getRoutePermission(req.nextUrl.pathname);
    if (requiredPermission && !hasPermission(req.auth?.user?.role, requiredPermission)) {
      return NextResponse.redirect(new URL(getDefaultPathForRole(req.auth?.user?.role), req.url));
    }
  }

  // NextAuth middleware works here but since API/static files might be requested, we return next
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
