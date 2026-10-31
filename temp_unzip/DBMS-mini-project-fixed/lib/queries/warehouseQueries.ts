import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { WarehouseInput, UpdateWarehouseInput } from "../validators/warehouse";

export interface WarehouseRow extends RowDataPacket {
  warehouse_id: number;
  name: string;
  location: string;
  capacity: number;
  active_shipments_origin?: number;
  active_shipments_destination?: number;
}

export async function getWarehouses(params: { q?: string }) {
  let whereClause = "";
  const queryParams: unknown[] = [];

  if (params.q) {
    whereClause = "WHERE w.name LIKE ? OR w.location LIKE ?";
    const term = `%${params.q}%`;
    queryParams.push(term, term);
  }

  const sql = `
    SELECT
      w.warehouse_id, w.name, w.location, w.capacity,
      (SELECT COUNT(*) FROM shipment s WHERE s.origin_warehouse_id = w.warehouse_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments_origin,
      (SELECT COUNT(*) FROM shipment s WHERE s.destination_warehouse_id = w.warehouse_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments_destination
    FROM warehouse w
    ${whereClause}
    ORDER BY w.warehouse_id ASC
  `;

  const [rows] = await pool.query<WarehouseRow[]>(sql, queryParams);
  return rows;
}

export async function getWarehouseById(warehouseId: number) {
  const sql = `
    SELECT
      w.warehouse_id, w.name, w.location, w.capacity,
      (SELECT COUNT(*) FROM shipment s WHERE s.origin_warehouse_id = w.warehouse_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments_origin,
      (SELECT COUNT(*) FROM shipment s WHERE s.destination_warehouse_id = w.warehouse_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments_destination
    FROM warehouse w
    WHERE w.warehouse_id = ?
  `;
  const [rows] = await pool.query<WarehouseRow[]>(sql, [warehouseId]);
  return rows[0] || null;
}

export async function createWarehouse(data: WarehouseInput) {
  const sql = `INSERT INTO warehouse (name, location, capacity) VALUES (?, ?, ?)`;
  const [result] = await pool.query<ResultSetHeader>(sql, [
    data.name,
    data.location,
    data.capacity,
  ]);
  return getWarehouseById(result.insertId);
}

export async function updateWarehouse(warehouseId: number, data: UpdateWarehouseInput) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.location !== undefined) {
    fields.push("location = ?");
    values.push(data.location);
  }
  if (data.capacity !== undefined) {
    fields.push("capacity = ?");
    values.push(data.capacity);
  }

  if (fields.length === 0) {
    return getWarehouseById(warehouseId);
  }

  values.push(warehouseId);
  const sql = `UPDATE warehouse SET ${fields.join(", ")} WHERE warehouse_id = ?`;
  await pool.query(sql, values);
  return getWarehouseById(warehouseId);
}

export async function deleteWarehouse(warehouseId: number) {
  const sql = "DELETE FROM warehouse WHERE warehouse_id = ?";
  const [result] = await pool.query<ResultSetHeader>(sql, [warehouseId]);
  return result.affectedRows > 0;
}
