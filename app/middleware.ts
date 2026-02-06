import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = req.nextUrl.pathname === "/" || req.nextUrl.pathname === "/signin";

  if (isAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const signInUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
