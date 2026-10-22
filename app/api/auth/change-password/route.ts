import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import { changePasswordSchema } from "@/lib/validators/auth";
import { verifyPassword, hashPassword } from "@/lib/auth/hash";
import { RowDataPacket } from "mysql2";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT password_hash FROM app_user WHERE user_id = ?",
      [user.userId]
    );

    const currentHash = rows[0]?.password_hash;
    if (!currentHash) {
      return errorResponse("NOT_FOUND", "User not found", [], 404);
    }

    const matches = await verifyPassword(currentPassword, currentHash);
    if (!matches) {
      return errorResponse("UNAUTHENTICATED", "Incorrect current password", [], 401);
    }

    const newHash = await hashPassword(newPassword);
    await pool.query("UPDATE app_user SET password_hash = ? WHERE user_id = ?", [newHash, user.userId]);

    await safeLogActivity(
      "PASSWORD_CHANGED",
      "user",
      user.userId,
      undefined,
      { email: user.email },
      { userId: user.userId, role: user.role, name: user.name }
    );

    return successResponse({ message: "Password updated successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
