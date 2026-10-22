import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";

export interface SessionUser {
  userId: number;
  email: string;
  role: Role;
  name: string;
  customerId?: number | null;
  driverId?: number | null;
}

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET || "super_secret_jwt_key_must_be_at_least_32_characters_long_123456";
  return new TextEncoder().encode(secret);
};

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "slm_session";
const SESSION_DAYS = parseInt(process.env.SESSION_DAYS || "7", 10);

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({
    role: payload.role,
    name: payload.name,
    email: payload.email,
    customerId: payload.customerId,
    driverId: payload.driverId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: parseInt(payload.sub as string, 10),
      email: payload.email as string,
      role: payload.role as Role,
      name: payload.name as string,
      customerId: (payload.customerId as number) || null,
      driverId: (payload.driverId as number) || null,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
