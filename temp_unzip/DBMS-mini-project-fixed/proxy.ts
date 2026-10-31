import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "./lib/auth";

export function proxy(request: NextRequest) {
  // Shipment lookup is the only public API; /track itself is the admin search page.
  if (request.nextUrl.pathname.startsWith("/api/track/") || request.nextUrl.pathname.startsWith("/track/")) return NextResponse.next();
  return authorizeAdmin(request) || NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/customers/:path*", "/shipments/:path*", "/vehicles/:path*", "/drivers/:path*", "/routes/:path*", "/warehouses/:path*", "/track/:path*"],
};
