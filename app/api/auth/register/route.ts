import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/hash";
import { createSessionCookie, SessionUser } from "@/lib/auth/session";
import { ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const email = data.email.toLowerCase().trim();

    // Check duplicate email
    const [existing] = await connection.query("SELECT user_id FROM app_user WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return errorResponse("DUPLICATE_ENTRY", "An account with this email already exists", [], 409);
    }

    const passwordHash = await hashPassword(data.password);

    await connection.beginTransaction();

    // 1. Insert customer
    const [custResult] = await connection.query<ResultSetHeader>(
      "INSERT INTO customer (name, email, phone, address) VALUES (?, ?, ?, ?)",
      [data.name.trim(), email, data.phone.trim(), data.address.trim()]
    );
    const customerId = custResult.insertId;

    // 2. Insert app_user linked to customer
    const [userResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO app_user (email, password_hash, role, customer_id, driver_id, is_active, last_login_at)
       VALUES (?, ?, 'CUSTOMER', ?, NULL, TRUE, NOW())`,
      [email, passwordHash, customerId]
    );
    const userId = userResult.insertId;

    await connection.commit();

    const sessionData: SessionUser = {
      userId,
      email,
      role: "CUSTOMER",
      name: data.name.trim(),
      customerId,
      driverId: null,
    };

    await createSessionCookie(sessionData);

    await safeLogActivity(
      "REGISTERED",
      "customer",
      customerId,
      undefined,
      { email, name: data.name },
      { userId, role: "CUSTOMER", name: data.name.trim() }
    );

    return successResponse({ user: sessionData }, undefined, 201);
  } catch (err) {
    await connection.rollback();
    return handleApiError(err);
  } finally {
    connection.release();
  }
}
