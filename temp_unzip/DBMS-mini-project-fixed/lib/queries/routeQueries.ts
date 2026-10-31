import { HttpError } from "../errors";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { RouteInput, UpdateRouteInput } from "../validators/route";

export interface RouteRow extends RowDataPacket {
  route_id: number;
  origin_warehouse_id: number;
  destination_warehouse_id: number;
  distance_km: number;
  est_time_hrs: number;
  origin_name: string;
  origin_location: string;
  destination_name: string;
  destination_location: string;
  shipment_count?: number;
}

export async function getRoutes(params: { q?: string }) {
  let whereClause = "";
  const queryParams: unknown[] = [];

  if (params.q) {
    whereClause = `
      WHERE wo.name LIKE ? OR wo.location LIKE ? 
         OR wd.name LIKE ? OR wd.location LIKE ?
    `;
    const term = `%${params.q}%`;
    queryParams.push(term, term, term, term);
  }

  const sql = `
    SELECT
      r.route_id, r.origin_warehouse_id, r.destination_warehouse_id,
      r.distance_km, r.est_time_hrs,
      wo.name AS origin_name, wo.location AS origin_location,
      wd.name AS destination_name, wd.location AS destination_location,
      COUNT(s.shipment_id) AS shipment_count
    FROM route r
    JOIN warehouse wo ON wo.warehouse_id = r.origin_warehouse_id
    JOIN warehouse wd ON wd.warehouse_id = r.destination_warehouse_id
    LEFT JOIN shipment s ON s.route_id = r.route_id
    ${whereClause}
    GROUP BY r.route_id
    ORDER BY r.route_id ASC
  `;

  const [rows] = await pool.query<RouteRow[]>(sql, queryParams);
  return rows;
}

export async function getRouteById(routeId: number) {
  const sql = `
    SELECT
      r.route_id, r.origin_warehouse_id, r.destination_warehouse_id,
      r.distance_km, r.est_time_hrs,
      wo.name AS origin_name, wo.location AS origin_location,
      wd.name AS destination_name, wd.location AS destination_location,
      COUNT(s.shipment_id) AS shipment_count
    FROM route r
    JOIN warehouse wo ON wo.warehouse_id = r.origin_warehouse_id
    JOIN warehouse wd ON wd.warehouse_id = r.destination_warehouse_id
    LEFT JOIN shipment s ON s.route_id = r.route_id
    WHERE r.route_id = ?
    GROUP BY r.route_id
  `;
  const [rows] = await pool.query<RouteRow[]>(sql, [routeId]);
  return rows[0] || null;
}

export async function createRoute(data: RouteInput) {
  const sql = `
    INSERT INTO route (origin_warehouse_id, destination_warehouse_id, distance_km, est_time_hrs)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query<ResultSetHeader>(sql, [
    data.origin_warehouse_id,
    data.destination_warehouse_id,
    data.distance_km,
    data.est_time_hrs,
  ]);
  return getRouteById(result.insertId);
}

export async function updateRoute(routeId: number, data: UpdateRouteInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [routes] = await conn.query<RouteRow[]>("SELECT * FROM route WHERE route_id = ? FOR UPDATE", [routeId]);
    if (!routes[0]) throw new HttpError(404, "Route not found");
    const origin = data.origin_warehouse_id ?? routes[0].origin_warehouse_id;
    const destination = data.destination_warehouse_id ?? routes[0].destination_warehouse_id;
    if (origin === destination) throw new HttpError(400, "Origin and destination must differ");
    if (origin !== routes[0].origin_warehouse_id || destination !== routes[0].destination_warehouse_id) {
      const [used] = await conn.query<RowDataPacket[]>("SELECT shipment_id FROM shipment WHERE route_id = ? LIMIT 1", [routeId]);
      if (used.length) throw new HttpError(409, "This route has shipments. Create a new route to change its endpoints.");
    }
    await conn.query("UPDATE route SET origin_warehouse_id = ?, destination_warehouse_id = ?, distance_km = ?, est_time_hrs = ? WHERE route_id = ?",
      [origin, destination, data.distance_km ?? routes[0].distance_km, data.est_time_hrs ?? routes[0].est_time_hrs, routeId]);
    await conn.commit();
  } catch (error) { await conn.rollback(); throw error; }
  finally { conn.release(); }
  return getRouteById(routeId);
}

export async function deleteRoute(routeId: number) {
  const sql = "DELETE FROM route WHERE route_id = ?";
  const [result] = await pool.query<ResultSetHeader>(sql, [routeId]);
  return result.affectedRows > 0;
}

// Q2: Shipments assigned to a route
export async function getRouteShipments(routeId: number) {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE route_id = ?
    ORDER BY booking_date DESC
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [routeId]);
  return rows;
}
