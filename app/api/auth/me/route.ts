import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import { pool } from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    // Fetch full linked details
    let phone: string | null = null;
    let address: string | null = null;
    let licenseNumber: string | null = null;

    if (user.role === "CUSTOMER" && user.customerId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT phone, address FROM customer WHERE customer_id = ?",
        [user.customerId]
      );
      if (rows[0]) {
        phone = rows[0].phone;
        address = rows[0].address;
      }
    } else if (user.role === "DELIVERY_PARTNER" && user.driverId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT phone, license_number FROM driver WHERE driver_id = ?",
        [user.driverId]
      );
      if (rows[0]) {
        phone = rows[0].phone;
        licenseNumber = rows[0].license_number;
      }
    }

    return successResponse({
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
        customerId: user.customerId,
        driverId: user.driverId,
        phone,
        address,
        licenseNumber,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
