import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import pool from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";
import { z } from "zod";

const updateCustomerProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80).optional(),
  phone: z.string().regex(/^\+?[\d\s-]{7,20}$/, "Invalid phone format").optional(),
  address: z.string().min(5, "Address must be at least 5 characters").max(255).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    let details: any = null;

    if (user.role === "CUSTOMER" && user.customerId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT customer_id, name, email, phone, address FROM customer WHERE customer_id = ?",
        [user.customerId]
      );
      details = rows[0] || null;
    } else if (user.role === "DELIVERY_PARTNER" && user.driverId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT driver_id, name, phone, license_number FROM driver WHERE driver_id = ?",
        [user.driverId]
      );
      details = rows[0] || null;
    }

    return successResponse({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: details?.name || user.name,
      details,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "CUSTOMER") {
      return errorResponse(
        "FORBIDDEN",
        `${user.role} profile details cannot be modified self-service. Contact admin.`,
        [],
        403
      );
    }

    if (!user.customerId) {
      return errorResponse("FORBIDDEN", "Customer record not found", [], 404);
    }

    const body = await request.json();
    const validated = updateCustomerProfileSchema.parse(body);

    const updates: string[] = [];
    const values: any[] = [];

    if (validated.name !== undefined) {
      updates.push("name = ?");
      values.push(validated.name);
    }
    if (validated.phone !== undefined) {
      updates.push("phone = ?");
      values.push(validated.phone);
    }
    if (validated.address !== undefined) {
      updates.push("address = ?");
      values.push(validated.address);
    }

    if (updates.length > 0) {
      values.push(user.customerId);
      await pool.query(
        `UPDATE customer SET ${updates.join(", ")} WHERE customer_id = ?`,
        values
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT customer_id, name, email, phone, address FROM customer WHERE customer_id = ?",
      [user.customerId]
    );

    await safeLogActivity(
      "PROFILE_UPDATED",
      "customer",
      user.customerId,
      undefined,
      { changes: validated },
      { userId: user.userId, role: user.role, name: user.name }
    );

    return successResponse(rows[0]);
  } catch (err) {
    return handleApiError(err);
  }
}
