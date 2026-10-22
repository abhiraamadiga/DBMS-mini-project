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
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const roleHome: Record<string, string> = {
    ADMIN: "/admin/dashboard",
    DELIVERY_PARTNER: "/partner/dashboard",
    CUSTOMER: "/customer/dashboard",
  };

  // 1. Auth pages (/login, /register)
  if (pathname === "/login" || pathname === "/register") {
    if (session) {
      const redirectUrl = new URL(roleHome[session.role] || "/dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 2. Role-specific protected areas
  const isAdminPath = pathname.startsWith("/admin");
  const isPartnerPath = pathname.startsWith("/partner");
  const isCustomerPath = pathname.startsWith("/customer");

  if (isAdminPath || isPartnerPath || isCustomerPath) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role boundary checks
    if (isAdminPath && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleHome[session.role], request.url));
    }
    if (isPartnerPath && session.role !== "DELIVERY_PARTNER") {
      return NextResponse.redirect(new URL(roleHome[session.role], request.url));
    }
    if (isCustomerPath && session.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL(roleHome[session.role], request.url));
    }
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
