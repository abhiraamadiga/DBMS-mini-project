import { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../db/mysql";
import { CustomerInput, UpdateCustomerInput } from "../validators/customer";

export interface CustomerRow extends RowDataPacket {
  customer_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  total_shipments?: number;
}

export async function getCustomers(params: { page?: number; limit?: number; q?: string }) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10));
  const offset = (page - 1) * limit;

  let whereClause = "";
  const queryParams: any[] = [];

  if (params.q) {
    whereClause = "WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?";
    const searchTerm = `%${params.q}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  // Count total matching
  const countSql = `SELECT COUNT(*) AS total FROM customer c ${whereClause}`;
  const [countResult] = await pool.query<RowDataPacket[]>(countSql, queryParams);
  const total = (countResult[0] as any).total;

  // Fetch paginated with total shipments count
  const sql = `
    SELECT
      c.customer_id, c.name, c.email, c.phone, c.address, c.created_at,
      COUNT(s.shipment_id) AS total_shipments
    FROM customer c
    LEFT JOIN shipment s ON s.customer_id = c.customer_id
    ${whereClause}
    GROUP BY c.customer_id
    ORDER BY c.customer_id DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query<CustomerRow[]>(sql, [...queryParams, limit, offset]);

  return {
    customers: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(customerId: number) {
  const sql = `
    SELECT
      c.customer_id, c.name, c.email, c.phone, c.address, c.created_at,
      COUNT(s.shipment_id) AS total_shipments
    FROM customer c
    LEFT JOIN shipment s ON s.customer_id = c.customer_id
    WHERE c.customer_id = ?
    GROUP BY c.customer_id
  `;
  const [rows] = await pool.query<CustomerRow[]>(sql, [customerId]);
  return rows[0] || null;
}

export async function createCustomer(data: CustomerInput) {
  const sql = `
    INSERT INTO customer (name, email, phone, address)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query<ResultSetHeader>(sql, [
    data.name,
    data.email,
    data.phone,
    data.address,
  ]);
  return getCustomerById(result.insertId);
}

export async function updateCustomer(customerId: number, data: UpdateCustomerInput) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push("phone = ?");
    values.push(data.phone);
  }
  if (data.address !== undefined) {
    fields.push("address = ?");
    values.push(data.address);
  }

  if (fields.length === 0) {
    return getCustomerById(customerId);
  }

  values.push(customerId);
  const sql = `UPDATE customer SET ${fields.join(", ")} WHERE customer_id = ?`;
  await pool.query(sql, values);
  return getCustomerById(customerId);
}

export async function deleteCustomer(customerId: number) {
  const sql = "DELETE FROM customer WHERE customer_id = ?";
  const [result] = await pool.query<ResultSetHeader>(sql, [customerId]);
  return result.affectedRows > 0;
}

// Q4: Customer's complete shipment history
export async function getCustomerShipments(customerId: number) {
  const sql = `
    SELECT *
    FROM v_shipment_overview
    WHERE customer_id = ?
    ORDER BY booking_date DESC
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [customerId]);
  return rows;
}
