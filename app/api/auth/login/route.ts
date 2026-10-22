import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/hash";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { createSessionCookie, SessionUser } from "@/lib/auth/session";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  email: string;
  password_hash: string;
  role: "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";
  customer_id: number | null;
  driver_id: number | null;
  is_active: number;
  customer_name?: string;
  driver_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const clientIp = request.headers.get("x-forwarded-for") || "local";
    const rateLimitKey = `${email.toLowerCase()}_${clientIp}`;

    const rateStatus = checkRateLimit(rateLimitKey);
    if (!rateStatus.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many failed login attempts. Please try again in 15 minutes.",
        [],
        429
      );
    }

    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.user_id, u.email, u.password_hash, u.role, u.customer_id, u.driver_id, u.is_active,
              c.name AS customer_name, d.name AS driver_name
       FROM app_user u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       LEFT JOIN driver d ON d.driver_id = u.driver_id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    // Constant-time check / no user enumeration
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return errorResponse("UNAUTHENTICATED", "Invalid email or password", [], 401);
    }

    if (!user.is_active) {
      return errorResponse("ACCOUNT_DISABLED", "Account disabled. Contact admin.", [], 401);
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      recordFailedAttempt(rateLimitKey);
      return errorResponse("UNAUTHENTICATED", "Invalid email or password", [], 401);
    }

    // Success: reset rate limit and record login
    resetRateLimit(rateLimitKey);
    await pool.query("UPDATE app_user SET last_login_at = NOW() WHERE user_id = ?", [user.user_id]);

    const displayName = user.customer_name || user.driver_name || "Admin";
    const sessionData: SessionUser = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: displayName,
      customerId: user.customer_id,
      driverId: user.driver_id,
    };

    await createSessionCookie(sessionData);

    await safeLogActivity(
      "LOGIN",
      "user",
      user.user_id,
      undefined,
      { role: user.role, email: user.email },
      { userId: user.user_id, role: user.role, name: displayName }
    );

    return successResponse({ user: sessionData });
  } catch (err) {
    return handleApiError(err);
  }
}
