import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/hash";
import { RowDataPacket } from "mysql2";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    const targetUserId = parseInt(id, 10);
    if (isNaN(targetUserId)) {
      return errorResponse("INVALID_ID", "User ID must be a number", [], 400);
    }

    const body = await request.json();
    const { temporaryPassword } = resetPasswordSchema.parse(body);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, email, role FROM app_user WHERE user_id = ?",
      [targetUserId]
    );
    const targetUser = rows[0];
    if (!targetUser) {
      return errorResponse("NOT_FOUND", "User not found", [], 404);
    }

    const newHash = await hashPassword(temporaryPassword);
    await pool.query("UPDATE app_user SET password_hash = ? WHERE user_id = ?", [newHash, targetUserId]);

    await safeLogActivity(
      "PASSWORD_RESET",
      "user",
      targetUserId,
      undefined,
      { targetEmail: targetUser.email, role: targetUser.role },
      { userId: admin.userId, role: admin.role, name: admin.name }
    );

    return successResponse({
      user_id: targetUserId,
      message: `Password reset successfully for ${targetUser.email}`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
