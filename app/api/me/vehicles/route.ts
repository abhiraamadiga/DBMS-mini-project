import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import pool from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth(["DELIVERY_PARTNER"]);

    if (!user.driverId) {
      return errorResponse("FORBIDDEN", "Driver record not linked", [], 403);
    }

    const [vehicles] = await pool.query<RowDataPacket[]>(
      `SELECT v.vehicle_id, v.vehicle_number, v.type, v.status, dv.assigned_on
       FROM driver_vehicle dv
       JOIN vehicle v ON v.vehicle_id = dv.vehicle_id
       WHERE dv.driver_id = ?
       ORDER BY dv.assigned_on DESC`,
      [user.driverId]
    );

    return successResponse(vehicles, { total: vehicles.length });
  } catch (err) {
    return handleApiError(err);
  }
}
