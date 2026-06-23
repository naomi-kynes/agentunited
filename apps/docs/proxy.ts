import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!api).*)"],
};
