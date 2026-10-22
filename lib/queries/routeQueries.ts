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
  const queryParams: any[] = [];

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
  const fields: string[] = [];
  const values: any[] = [];

  if (data.origin_warehouse_id !== undefined) {
    fields.push("origin_warehouse_id = ?");
    values.push(data.origin_warehouse_id);
  }
  if (data.destination_warehouse_id !== undefined) {
    fields.push("destination_warehouse_id = ?");
    values.push(data.destination_warehouse_id);
  }
  if (data.distance_km !== undefined) {
    fields.push("distance_km = ?");
    values.push(data.distance_km);
  }
  if (data.est_time_hrs !== undefined) {
    fields.push("est_time_hrs = ?");
    values.push(data.est_time_hrs);
  }

  if (fields.length === 0) {
    return getRouteById(routeId);
  }

  values.push(routeId);
  const sql = `UPDATE route SET ${fields.join(", ")} WHERE route_id = ?`;
  await pool.query(sql, values);
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
