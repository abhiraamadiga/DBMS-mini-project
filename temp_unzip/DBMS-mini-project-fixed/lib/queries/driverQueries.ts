import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { DriverInput, UpdateDriverInput } from "../validators/driver";

export interface DriverRow extends RowDataPacket {
  driver_id: number;
  name: string;
  phone: string;
  license_number: string;
  assigned_vehicles?: string;
  vehicle_ids?: string;
  active_shipments?: number;
}

export async function getDrivers(params: { q?: string }) {
  let whereClause = "";
  const queryParams: unknown[] = [];

  if (params.q) {
    whereClause = "WHERE d.name LIKE ? OR d.phone LIKE ? OR d.license_number LIKE ?";
    const term = `%${params.q}%`;
    queryParams.push(term, term, term);
  }

  const sql = `
    SELECT
      d.driver_id, d.name, d.phone, d.license_number,
      GROUP_CONCAT(DISTINCT v.vehicle_number SEPARATOR ', ') AS assigned_vehicles,
      GROUP_CONCAT(DISTINCT v.vehicle_id SEPARATOR ',') AS vehicle_ids,
      (SELECT COUNT(*) FROM shipment s WHERE s.driver_id = d.driver_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments
    FROM driver d
    LEFT JOIN driver_vehicle dv ON dv.driver_id = d.driver_id
    LEFT JOIN vehicle v ON v.vehicle_id = dv.vehicle_id
    ${whereClause}
    GROUP BY d.driver_id
    ORDER BY d.driver_id ASC
  `;

  const [rows] = await pool.query<DriverRow[]>(sql, queryParams);
  return rows;
}

export async function getDriverById(driverId: number) {
  const sql = `
    SELECT
      d.driver_id, d.name, d.phone, d.license_number,
      GROUP_CONCAT(DISTINCT v.vehicle_number SEPARATOR ', ') AS assigned_vehicles,
      GROUP_CONCAT(DISTINCT v.vehicle_id SEPARATOR ',') AS vehicle_ids,
      (SELECT COUNT(*) FROM shipment s WHERE s.driver_id = d.driver_id AND s.current_status NOT IN ('DELIVERED', 'CANCELLED')) AS active_shipments
    FROM driver d
    LEFT JOIN driver_vehicle dv ON dv.driver_id = d.driver_id
    LEFT JOIN vehicle v ON v.vehicle_id = dv.vehicle_id
    WHERE d.driver_id = ?
    GROUP BY d.driver_id
  `;
  const [rows] = await pool.query<DriverRow[]>(sql, [driverId]);
  return rows[0] || null;
}

export async function createDriver(data: DriverInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const insertDriverSql = `
      INSERT INTO driver (name, phone, license_number)
      VALUES (?, ?, ?)
    `;
    const [result] = await conn.query<ResultSetHeader>(insertDriverSql, [
      data.name,
      data.phone,
      data.license_number,
    ]);
    const driverId = result.insertId;

    if (data.vehicle_ids && data.vehicle_ids.length > 0) {
      for (const vid of data.vehicle_ids) {
        await conn.query(
          "INSERT INTO driver_vehicle (driver_id, vehicle_id, assigned_on) VALUES (?, ?, CURRENT_DATE)",
          [driverId, vid]
        );
      }
    }

    await conn.commit();
    return getDriverById(driverId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateDriver(driverId: number, data: UpdateDriverInput) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.license_number !== undefined) {
      fields.push("license_number = ?");
      values.push(data.license_number);
    }

    if (fields.length > 0) {
      values.push(driverId);
      const sql = `UPDATE driver SET ${fields.join(", ")} WHERE driver_id = ?`;
      await conn.query(sql, values);
    }

    if (data.vehicle_ids !== undefined) {
      await conn.query("DELETE FROM driver_vehicle WHERE driver_id = ?", [driverId]);
      for (const vid of data.vehicle_ids) {
        await conn.query(
          "INSERT INTO driver_vehicle (driver_id, vehicle_id, assigned_on) VALUES (?, ?, CURRENT_DATE)",
          [driverId, vid]
        );
      }
    }

    await conn.commit();
    return getDriverById(driverId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteDriver(driverId: number) {
  const sql = "DELETE FROM driver WHERE driver_id = ?";
  const [result] = await pool.query<ResultSetHeader>(sql, [driverId]);
  return result.affectedRows > 0;
}

// Q2: Shipments assigned to a driver
export async function getDriverShipments(driverId: number) {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE driver_id = ?
    ORDER BY booking_date DESC
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [driverId]);
  return rows;
}
