import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import { createPartnerUserSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/hash";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.user_id, u.email, u.role, u.customer_id, u.driver_id, u.is_active,
              u.last_login_at, u.created_at,
              COALESCE(c.name, d.name, 'Admin') AS linked_name,
              c.phone AS customer_phone, d.phone AS driver_phone,
              d.license_number
       FROM app_user u
       LEFT JOIN customer c ON c.customer_id = u.customer_id
       LEFT JOIN driver d ON d.driver_id = u.driver_id
       ORDER BY u.created_at DESC`
    );

    return successResponse(rows, { total: rows.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const admin = await requireAuth(["ADMIN"]);
    const body = await request.json();
    const data = createPartnerUserSchema.parse(body);

    const email = data.email.toLowerCase().trim();

    // Check duplicate email
    const [existing] = await connection.query("SELECT user_id FROM app_user WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return errorResponse("DUPLICATE_ENTRY", "A user account with this email already exists", [], 409);
    }

    const passwordHash = await hashPassword(data.password);

    await connection.beginTransaction();

    // 1. Insert driver
    const [driverResult] = await connection.query<ResultSetHeader>(
      "INSERT INTO driver (name, phone, license_number) VALUES (?, ?, ?)",
      [data.name.trim(), data.phone.trim(), data.licenseNumber.trim()]
    );
    const driverId = driverResult.insertId;

    // Optional: link vehicles
    if (data.vehicleIds && data.vehicleIds.length > 0) {
      for (const vid of data.vehicleIds) {
        await connection.query(
          "INSERT INTO driver_vehicle (driver_id, vehicle_id, assigned_on) VALUES (?, ?, CURDATE())",
          [driverId, vid]
        );
      }
    }

    // 2. Insert app_user linked to driver
    const [userResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO app_user (email, password_hash, role, customer_id, driver_id, is_active)
       VALUES (?, ?, 'DELIVERY_PARTNER', NULL, ?, TRUE)`,
      [email, passwordHash, driverId]
    );
    const userId = userResult.insertId;

    await connection.commit();

    await safeLogActivity(
      "USER_CREATED",
      "user",
      userId,
      undefined,
      { role: "DELIVERY_PARTNER", email, driverId },
      { userId: admin.userId, role: admin.role, name: admin.name }
    );

    return successResponse(
      {
        user_id: userId,
        email,
        role: "DELIVERY_PARTNER",
        driver_id: driverId,
        name: data.name,
      },
      undefined,
      201
    );
  } catch (err) {
    await connection.rollback();
    return handleApiError(err);
  } finally {
    connection.release();
  }
}
