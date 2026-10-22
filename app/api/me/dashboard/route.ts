import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import pool from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth(["CUSTOMER", "DELIVERY_PARTNER"]);

    if (user.role === "CUSTOMER") {
      if (!user.customerId) {
        return errorResponse("FORBIDDEN", "Customer profile not linked", [], 403);
      }

      const [totals] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) AS total_shipments,
          SUM(CASE WHEN current_status = 'IN_TRANSIT' THEN 1 ELSE 0 END) AS in_transit_count,
          SUM(CASE WHEN current_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
          SUM(CASE WHEN is_delayed = 1 THEN 1 ELSE 0 END) AS delayed_count,
          SUM(CASE WHEN current_status IN ('BOOKED', 'PICKED_UP') THEN 1 ELSE 0 END) AS pending_count
        FROM v_shipment_overview
        WHERE customer_id = ?`,
        [user.customerId]
      );

      const [recent] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM v_shipment_overview
        WHERE customer_id = ?
        ORDER BY booking_date DESC, shipment_id DESC
        LIMIT 5`,
        [user.customerId]
      );

      const t = totals[0] || {};
      return successResponse({
        role: "CUSTOMER",
        totalShipments: Number(t.total_shipments || 0),
        inTransitCount: Number(t.in_transit_count || 0),
        deliveredCount: Number(t.delivered_count || 0),
        delayedCount: Number(t.delayed_count || 0),
        pendingCount: Number(t.pending_count || 0),
        recentShipments: recent,
      });
    }

    if (user.role === "DELIVERY_PARTNER") {
      if (!user.driverId) {
        return errorResponse("FORBIDDEN", "Driver profile not linked", [], 403);
      }

      const [totals] = await pool.query<RowDataPacket[]>(
        `SELECT
          COUNT(*) AS total_deliveries,
          SUM(CASE WHEN current_status IN ('PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY') THEN 1 ELSE 0 END) AS active_count,
          SUM(CASE WHEN current_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
          SUM(CASE WHEN is_delayed = 1 THEN 1 ELSE 0 END) AS delayed_count,
          SUM(CASE WHEN current_status = 'BOOKED' THEN 1 ELSE 0 END) AS pending_pickup_count
        FROM v_shipment_overview
        WHERE driver_id = ?`,
        [user.driverId]
      );

      const [recent] = await pool.query<RowDataPacket[]>(
        `SELECT *
        FROM v_shipment_overview
        WHERE driver_id = ?
        ORDER BY booking_date DESC, shipment_id DESC
        LIMIT 5`,
        [user.driverId]
      );

      // Current assigned vehicles
      const [vehicles] = await pool.query<RowDataPacket[]>(
        `SELECT v.vehicle_id, v.vehicle_number, v.type, v.status, v.capacity_kg
         FROM driver_vehicle dv
         JOIN vehicle v ON v.vehicle_id = dv.vehicle_id
         WHERE dv.driver_id = ?`,
        [user.driverId]
      );

      const t = totals[0] || {};
      return successResponse({
        role: "DELIVERY_PARTNER",
        totalDeliveries: Number(t.total_deliveries || 0),
        activeCount: Number(t.active_count || 0),
        deliveredCount: Number(t.delivered_count || 0),
        delayedCount: Number(t.delayed_count || 0),
        pendingPickupCount: Number(t.pending_pickup_count || 0),
        assignedVehicles: vehicles,
        recentDeliveries: recent,
      });
    }

    return errorResponse("FORBIDDEN", "Access denied", [], 403);
  } catch (err) {
    return handleApiError(err);
  }
}
