import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, handleApiError } from "@/lib/api";
import { signToken, getRoleCookieName, SESSION_COOKIE_NAME, SessionUser } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  email: string;
  role: "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";
  customer_id: number | null;
  driver_id: number | null;
  customer_name?: string;
  driver_name?: string;
}

export async function POST(_request: NextRequest) {
  try {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.user_id, u.email, u.role, u.customer_id, u.driver_id,
              c.name AS customer_name, d.name AS driver_name
       FROM app_user u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       LEFT JOIN driver d ON d.driver_id = u.driver_id
       WHERE u.email IN ('admin@smartlogistics.com', 'rajesh.partner@smartlogistics.com', 'aditi.sharma@example.com')`
    );

    const cookieStore = await cookies();
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    };

    for (const user of rows) {
      const displayName = user.customer_name || user.driver_name || "Admin";
      const sessionData: SessionUser = {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        name: displayName,
        customerId: user.customer_id,
        driverId: user.driver_id,
      };

      const token = await signToken(sessionData);
      cookieStore.set(getRoleCookieName(user.role), token, cookieOpts);

      // Default main session to Admin
      if (user.role === "ADMIN") {
        cookieStore.set(SESSION_COOKIE_NAME, token, cookieOpts);
      }
    }

    return successResponse({
      message: "All 3 roles authenticated for concurrent multi-tab demo",
      portals: {
        admin: "/admin/dashboard",
        partner: "/partner/dashboard",
        customer: "/customer/dashboard",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

