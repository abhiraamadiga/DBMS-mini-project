import { HttpError } from "../errors";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { CreateShipmentInput } from "../validators/shipment";
import { connectMongo } from "../db/mongo";
import ActivityLog from "../models/ActivityLog";

export interface ShipmentOverviewRow extends RowDataPacket {
  shipment_id: number;
  tracking_id: string;
  booking_date: string;
  expected_delivery: string;
  current_status: string;
  customer_id: number;
  customer_name: string;
  origin_id: number;
  origin_name: string;
  origin_location: string;
  destination_id: number;
  destination_name: string;
  destination_location: string;
  route_id: number;
  vehicle_id: number | null;
  vehicle_number: string | null;
  driver_id: number | null;
  driver_name: string | null;
  current_location: string | null;
  is_delayed: number;
}

export interface PackageRow extends RowDataPacket {
  package_id: number;
  shipment_id: number;
  weight: number;
  fragile: boolean | number;
  dimensions: string;
}

export interface TrackingEventRow extends RowDataPacket {
  event_id: number;
  shipment_id: number;
  status: string;
  location: string;
  event_timestamp: string;
}

export async function getShipments(params: {
  q?: string;
  status?: string;
  delayed?: boolean;
  customerId?: number;
  vehicleId?: number;
  driverId?: number;
  routeId?: number;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const queryParams: unknown[] = [];

  if (params.q) {
    whereClauses.push(
      "(tracking_id LIKE ? OR customer_name LIKE ? OR origin_name LIKE ? OR destination_name LIKE ?)"
    );
    const term = `%${params.q}%`;
    queryParams.push(term, term, term, term);
  }

  if (params.status) {
    whereClauses.push("current_status = ?");
    queryParams.push(params.status);
  }

  if (params.delayed === true) {
    whereClauses.push("is_delayed = 1");
  }

  if (params.customerId) {
    whereClauses.push("customer_id = ?");
    queryParams.push(params.customerId);
  }

  if (params.vehicleId) {
    whereClauses.push("vehicle_id = ?");
    queryParams.push(params.vehicleId);
  }

  if (params.driverId) {
    whereClauses.push("driver_id = ?");
    queryParams.push(params.driverId);
  }

  if (params.routeId) {
    whereClauses.push("route_id = ?");
    queryParams.push(params.routeId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Count total matching
  const countSql = `SELECT COUNT(*) AS total FROM v_shipment_overview ${whereSql}`;
  const [countRes] = await pool.query<RowDataPacket[]>(countSql, queryParams);
  const total = Number(countRes[0].total);

  // Fetch paginated
  const sql = `
    SELECT *
    FROM v_shipment_overview
    ${whereSql}
    ORDER BY booking_date DESC, shipment_id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query<ShipmentOverviewRow[]>(sql, [...queryParams, limit, offset]);

  return {
    shipments: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getShipmentById(shipmentId: number) {
  const overviewSql = "SELECT * FROM v_shipment_overview WHERE shipment_id = ?";
  const [shipments] = await pool.query<ShipmentOverviewRow[]>(overviewSql, [shipmentId]);
  if (!shipments[0]) return null;

  const pkgSql = "SELECT package_id, shipment_id, weight, fragile, dimensions FROM package WHERE shipment_id = ?";
  const [packages] = await pool.query<PackageRow[]>(pkgSql, [shipmentId]);

  const eventSql = `
    SELECT event_id, shipment_id, status, location, event_timestamp
    FROM tracking_event
    WHERE shipment_id = ?
    ORDER BY event_timestamp ASC, event_id ASC
  `;
  const [events] = await pool.query<TrackingEventRow[]>(eventSql, [shipmentId]);

  return {
    ...shipments[0],
    is_delayed: Boolean(shipments[0].is_delayed),
    packages,
    timeline: events,
  };
}

// Q1: Track by tracking ID (status + current location + timeline)
export async function getShipmentByTrackingId(trackingId: string) {
  const overviewSql = "SELECT * FROM v_shipment_overview WHERE tracking_id = ?";
  const [shipments] = await pool.query<ShipmentOverviewRow[]>(overviewSql, [trackingId]);
  if (!shipments[0]) return null;

  const shipmentId = shipments[0].shipment_id;

  const pkgSql = "SELECT package_id, shipment_id, weight, fragile, dimensions FROM package WHERE shipment_id = ?";
  const [packages] = await pool.query<PackageRow[]>(pkgSql, [shipmentId]);

  const eventSql = `
    SELECT event_id, shipment_id, status, location, event_timestamp
    FROM tracking_event
    WHERE shipment_id = ?
    ORDER BY event_timestamp ASC, event_id ASC
  `;
  const [events] = await pool.query<TrackingEventRow[]>(eventSql, [shipmentId]);

  return {
    ...shipments[0],
    is_delayed: Boolean(shipments[0].is_delayed),
    packages,
    timeline: events,
  };
}

// Q3: Delayed shipments
export async function getDelayedShipments() {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE is_delayed = 1
    ORDER BY expected_delivery ASC
  `;
  const [rows] = await pool.query<ShipmentOverviewRow[]>(sql);
  return rows;
}

// Q3: Pending shipments
export async function getPendingShipments() {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE current_status IN ('BOOKED', 'PICKED_UP')
    ORDER BY expected_delivery ASC
  `;
  const [rows] = await pool.query<ShipmentOverviewRow[]>(sql);
  return rows;
}

// Transactional Create Shipment
export async function createShipment(data: CreateShipmentInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify customer exists
    const [custRows] = await conn.query<RowDataPacket[]>(
      "SELECT customer_id, name FROM customer WHERE customer_id = ?",
      [data.customerId]
    );
    if (!custRows[0]) {
      throw new HttpError(404, "Customer does not exist");
    }

    // 2. Verify route exists and derive origin & destination
    const [routeRows] = await conn.query<RowDataPacket[]>(
      `SELECT r.route_id, r.origin_warehouse_id, r.destination_warehouse_id,
              wo.name AS origin_name, wo.location AS origin_location
       FROM route r
       JOIN warehouse wo ON wo.warehouse_id = r.origin_warehouse_id
       WHERE r.route_id = ? FOR UPDATE`,
      [data.routeId]
    );
    if (!routeRows[0]) {
      throw new HttpError(404, "Route does not exist");
    }
    const routeInfo = routeRows[0];

    // 3. Verify vehicle availability (if assigned)
    if (data.vehicleId) {
      const [vehicleRows] = await conn.query<RowDataPacket[]>(
        "SELECT vehicle_id, status FROM vehicle WHERE vehicle_id = ? FOR UPDATE",
        [data.vehicleId]
      );
      if (!vehicleRows[0]) {
        throw new HttpError(404, "Vehicle does not exist");
      }
      if (vehicleRows[0].status === "MAINTENANCE") {
        throw new HttpError(400, "Cannot assign vehicle currently under MAINTENANCE");
      }
    }

    // 4. Verify driver (if assigned)
    if (data.driverId) {
      const [driverRows] = await conn.query<RowDataPacket[]>(
        "SELECT driver_id FROM driver WHERE driver_id = ?",
        [data.driverId]
      );
      if (!driverRows[0]) {
        throw new HttpError(404, "Driver does not exist");
      }
    }

    // 5. Verify expected_delivery is today or later
    const [todayRows] = await conn.query<RowDataPacket[]>("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    if (data.expectedDelivery < todayRows[0].today) {
      throw new HttpError(400, "Expected delivery date must be today or a future date");
    }

    // 6. Insert initial shipment record with temporary tracking_id
    const tempTracking = `TMP${Date.now()}`;
    const insertShipmentSql = `
      INSERT INTO shipment (
        tracking_id, customer_id, route_id,
        origin_warehouse_id, destination_warehouse_id,
        vehicle_id, driver_id, booking_date, expected_delivery, current_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'BOOKED')
    `;

    const [shipmentResult] = await conn.query<ResultSetHeader>(insertShipmentSql, [
      tempTracking,
      data.customerId,
      data.routeId,
      routeInfo.origin_warehouse_id,
      routeInfo.destination_warehouse_id,
      data.vehicleId || null,
      data.driverId || null,
      data.expectedDelivery,
    ]);

    const shipmentId = shipmentResult.insertId;

    // 7. Generate official server-side tracking ID: SLM + year + 6-digit sequence
    const year = new Date().getFullYear();
    const officialTrackingId = `SLM${year}${String(shipmentId).padStart(6, "0")}`;

    await conn.query("UPDATE shipment SET tracking_id = ? WHERE shipment_id = ?", [
      officialTrackingId,
      shipmentId,
    ]);

    // 8. Insert packages (min 1)
    const insertPackageSql = `
      INSERT INTO package (shipment_id, weight, fragile, dimensions)
      VALUES (?, ?, ?, ?)
    `;
    for (const pkg of data.packages) {
      await conn.query(insertPackageSql, [
        shipmentId,
        pkg.weight,
        pkg.fragile ? 1 : 0,
        pkg.dimensions,
      ]);
    }

    // 9. Insert first tracking event: BOOKED at origin warehouse
    const originLocation = String(routeInfo.origin_location);
    const insertEventSql = `
      INSERT INTO tracking_event (shipment_id, status, location, event_timestamp)
      VALUES (?, 'BOOKED', ?, NOW())
    `;
    await conn.query(insertEventSql, [shipmentId, originLocation]);

    // Commit transaction
    await conn.commit();

    return getShipmentById(shipmentId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Assign vehicle and driver to an existing shipment
export async function assignShipment(
  shipmentId: number,
  vehicleId?: number | null,
  driverId?: number | null
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [shipmentRows] = await conn.query<RowDataPacket[]>(
      "SELECT shipment_id, current_status FROM shipment WHERE shipment_id = ? FOR UPDATE",
      [shipmentId]
    );
    if (!shipmentRows[0]) {
      throw new HttpError(404, "Shipment not found");
    }

    if (vehicleId) {
      const [vehicleRows] = await conn.query<RowDataPacket[]>(
        "SELECT vehicle_id, status, vehicle_number FROM vehicle WHERE vehicle_id = ? FOR UPDATE",
        [vehicleId]
      );
      if (!vehicleRows[0]) {
        throw new HttpError(404, "Vehicle not found");
      }
      if (vehicleRows[0].status === "MAINTENANCE") {
        throw new HttpError(400, "Cannot assign vehicle currently under MAINTENANCE");
      }
    }

    if (driverId) {
      const [driverRows] = await conn.query<RowDataPacket[]>(
        "SELECT driver_id FROM driver WHERE driver_id = ?",
        [driverId]
      );
      if (!driverRows[0]) {
        throw new HttpError(404, "Driver not found");
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (vehicleId !== undefined) {
      updates.push("vehicle_id = ?");
      values.push(vehicleId);
    }
    if (driverId !== undefined) {
      updates.push("driver_id = ?");
      values.push(driverId);
    }

    if (updates.length > 0) {
      values.push(shipmentId);
      await conn.query(`UPDATE shipment SET ${updates.join(", ")} WHERE shipment_id = ?`, values);
    }

    await conn.commit();
    return getShipmentById(shipmentId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Add tracking event (enforcing terminal status business rule 6)
export async function addTrackingEvent(
  shipmentId: number,
  status: string,
  location: string
) {
  const conn = await pool.getConnection();
  let eventId: number;
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT current_status FROM shipment WHERE shipment_id = ? FOR UPDATE", [shipmentId]
    );
    if (!rows[0]) throw new HttpError(404, "Shipment not found");
    if (["DELIVERED", "CANCELLED"].includes(rows[0].current_status)) {
      throw new HttpError(409, "Shipment has reached a terminal status and cannot accept new events");
    }
    const [result] = await conn.query<ResultSetHeader>(
      "INSERT INTO tracking_event (shipment_id, status, location, event_timestamp) VALUES (?, ?, ?, NOW())",
      [shipmentId, status, location]
    );
    eventId = result.insertId;
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
  return { eventId, shipmentId, status, location, shipment: await getShipmentById(shipmentId) };
}

// Dashboard statistics payload
export async function getDashboardStats() {
  // Total shipments, by status, delayed, pending
  const [totals] = await pool.query<RowDataPacket[]>(`
    SELECT
      COUNT(*) AS total_shipments,
      SUM(CASE WHEN current_status = 'IN_TRANSIT' THEN 1 ELSE 0 END) AS in_transit_count,
      SUM(CASE WHEN current_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_count,
      SUM(CASE WHEN is_delayed = 1 THEN 1 ELSE 0 END) AS delayed_count,
      SUM(CASE WHEN current_status IN ('BOOKED', 'PICKED_UP') THEN 1 ELSE 0 END) AS pending_count
    FROM v_shipment_overview
  `);

  // Active vehicles (status = 'ON_TRIP') & Available vehicles
  const [vehicleStats] = await pool.query<RowDataPacket[]>(`
    SELECT
      SUM(CASE WHEN status = 'ON_TRIP' THEN 1 ELSE 0 END) AS active_vehicles,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_vehicles,
      SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) AS maintenance_vehicles,
      COUNT(*) AS total_vehicles
    FROM vehicle
  `);

  // Available drivers count
  const [driverStats] = await pool.query<RowDataPacket[]>(`
    SELECT COUNT(*) AS available_drivers FROM driver d
    WHERE NOT EXISTS (SELECT 1 FROM shipment s WHERE s.driver_id = d.driver_id
      AND s.current_status NOT IN ('DELIVERED', 'CANCELLED'))
  `);

  // Shipments per status (for donut/pie chart)
  const [statusCounts] = await pool.query<RowDataPacket[]>(`
    SELECT current_status AS status, COUNT(*) AS count
    FROM shipment
    GROUP BY current_status
    ORDER BY count DESC
  `);

  // Shipments per day for the last 14 days (for area chart)
  const [shipmentsPerDay] = await pool.query<RowDataPacket[]>(`
    SELECT
      DATE_FORMAT(booking_date, '%Y-%m-%d') AS date,
      COUNT(*) AS count
    FROM shipment
    WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY DATE_FORMAT(booking_date, '%Y-%m-%d')
    ORDER BY date ASC
  `);

  // Top 5 routes by shipment count (for bar chart)
  const [topRoutes] = await pool.query<RowDataPacket[]>(`
    SELECT
      r.route_id,
      CONCAT(wo.name, ' -> ', wd.name) AS route_name,
      COUNT(s.shipment_id) AS shipment_count
    FROM route r
    JOIN warehouse wo ON wo.warehouse_id = r.origin_warehouse_id
    JOIN warehouse wd ON wd.warehouse_id = r.destination_warehouse_id
    LEFT JOIN shipment s ON s.route_id = r.route_id
    GROUP BY r.route_id
    ORDER BY shipment_count DESC
    LIMIT 5
  `);

  // 5 most recent activity logs from MongoDB
  let recentLogs: import("../models/ActivityLog").IActivityLog[] = [];
  try {
    await connectMongo();
    recentLogs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(5).lean();
  } catch (mongoErr) {
    console.warn("Could not fetch activity logs for dashboard stats:", mongoErr);
  }

  const t = totals[0] || {};
  const v = vehicleStats[0] || {};
  const d = driverStats[0] || {};

  return {
    totalShipments: Number(t.total_shipments || 0),
    inTransitCount: Number(t.in_transit_count || 0),
    deliveredCount: Number(t.delivered_count || 0),
    delayedCount: Number(t.delayed_count || 0),
    pendingCount: Number(t.pending_count || 0),
    activeVehicles: Number(v.active_vehicles || 0),
    availableVehicles: Number(v.available_vehicles || 0),
    availableDrivers: Number(d.available_drivers || 0),
    statusDistribution: statusCounts,
    dailyShipments: shipmentsPerDay,
    topRoutes,
    recentActivityLogs: recentLogs,
  };
}
