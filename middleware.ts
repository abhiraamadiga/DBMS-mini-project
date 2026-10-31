import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "slm_session";
const AUTH_SECRET = process.env.AUTH_SECRET || "super_secret_jwt_key_must_be_at_least_32_characters_long_123456";

interface JwtPayload {
  sub: string;
  role: "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";
  name: string;
  email: string;
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const key = new TextEncoder().encode(AUTH_SECRET);
    const { payload } = await jwtVerify(token, key);
    return {
      sub: payload.sub as string,
      role: payload.role as "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER",
      name: payload.name as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: any) {
  const { pathname } = request.nextUrl;

  // Read role-specific cookies and generic session cookie
  const adminToken = request.cookies.get("slm_session_admin")?.value;
  const partnerToken = request.cookies.get("slm_session_partner")?.value;
  const customerToken = request.cookies.get("slm_session_customer")?.value;
  const mainToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const adminSession = adminToken ? await verifyToken(adminToken) : null;
  const partnerSession = partnerToken ? await verifyToken(partnerToken) : null;
  const customerSession = customerToken ? await verifyToken(customerToken) : null;
  const mainSession = mainToken ? await verifyToken(mainToken) : null;

  // 1. Auth pages (/login, /register) - allow visiting anytime to switch roles
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // 2. Role-specific protected areas
  const isAdminPath = pathname.startsWith("/admin");
  const isPartnerPath = pathname.startsWith("/partner");
  const isCustomerPath = pathname.startsWith("/customer");

  if (isAdminPath) {
    if (adminSession?.role === "ADMIN" || mainSession?.role === "ADMIN") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPartnerPath) {
    if (partnerSession?.role === "DELIVERY_PARTNER" || mainSession?.role === "DELIVERY_PARTNER") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCustomerPath) {
    if (customerSession?.role === "CUSTOMER" || mainSession?.role === "CUSTOMER") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/partner/:path*",
    "/customer/:path*",
    "/login",
    "/register",
  ],
};
