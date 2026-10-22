import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { VehicleInput, UpdateVehicleInput } from "../validators/vehicle";

export interface VehicleRow extends RowDataPacket {
  vehicle_id: number;
  vehicle_number: string;
  type: string;
  status: string;
  driver_names?: string;
  driver_ids?: string;
  active_shipments?: number;
}

export async function getVehicles(params: { q?: string; status?: string; type?: string }) {
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (params.q) {
    whereClauses.push("v.vehicle_number LIKE ?");
    queryParams.push(`%${params.q}%`);
  }
  if (params.status) {
    whereClauses.push("v.status = ?");
    queryParams.push(params.status);
  }
  if (params.type) {
    whereClauses.push("v.type = ?");
    queryParams.push(params.type);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      v.vehicle_id, v.vehicle_number, v.type, v.status,
      GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') AS driver_names,
      GROUP_CONCAT(DISTINCT d.driver_id SEPARATOR ',') AS driver_ids,
      (SELECT COUNT(*) FROM shipment s WHERE s.vehicle_id = v.vehicle_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments
    FROM vehicle v
    LEFT JOIN driver_vehicle dv ON dv.vehicle_id = v.vehicle_id
    LEFT JOIN driver d ON d.driver_id = dv.driver_id
    ${whereSql}
    GROUP BY v.vehicle_id
    ORDER BY v.vehicle_id ASC
  `;

  const [rows] = await pool.query<VehicleRow[]>(sql, queryParams);
  return rows;
}

export async function getVehicleById(vehicleId: number) {
  const sql = `
    SELECT
      v.vehicle_id, v.vehicle_number, v.type, v.status,
      GROUP_CONCAT(DISTINCT d.name SEPARATOR ', ') AS driver_names,
      GROUP_CONCAT(DISTINCT d.driver_id SEPARATOR ',') AS driver_ids,
      (SELECT COUNT(*) FROM shipment s WHERE s.vehicle_id = v.vehicle_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments
    FROM vehicle v
    LEFT JOIN driver_vehicle dv ON dv.vehicle_id = v.vehicle_id
    LEFT JOIN driver d ON d.driver_id = dv.driver_id
    WHERE v.vehicle_id = ?
    GROUP BY v.vehicle_id
  `;
  const [rows] = await pool.query<VehicleRow[]>(sql, [vehicleId]);
  return rows[0] || null;
}

export async function createVehicle(data: VehicleInput) {
  const sql = `INSERT INTO vehicle (vehicle_number, type, status) VALUES (?, ?, ?)`;
  const [result] = await pool.query<ResultSetHeader>(sql, [
    data.vehicle_number,
    data.type,
    data.status,
  ]);
  return getVehicleById(result.insertId);
}

export async function updateVehicle(vehicleId: number, data: UpdateVehicleInput) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.vehicle_number !== undefined) {
    fields.push("vehicle_number = ?");
    values.push(data.vehicle_number);
  }
  if (data.type !== undefined) {
    fields.push("type = ?");
    values.push(data.type);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  if (fields.length === 0) {
    return getVehicleById(vehicleId);
  }

  values.push(vehicleId);
  const sql = `UPDATE vehicle SET ${fields.join(", ")} WHERE vehicle_id = ?`;
  await pool.query(sql, values);
  return getVehicleById(vehicleId);
}

export async function deleteVehicle(vehicleId: number) {
  const sql = "DELETE FROM vehicle WHERE vehicle_id = ?";
  const [result] = await pool.query<ResultSetHeader>(sql, [vehicleId]);
  return result.affectedRows > 0;
}

// Q2: Shipments assigned to a vehicle
export async function getVehicleShipments(vehicleId: number) {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE vehicle_id = ?
    ORDER BY booking_date DESC
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [vehicleId]);
  return rows;
}
