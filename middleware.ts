import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAdminRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = nextUrl.pathname === "/login";

  // Rediriger vers login si non authentifié sur route admin
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Rediriger vers dashboard si déjà connecté sur page login
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
