import { NextRequest } from "next/server";
import { pool } from "@/lib/db/mysql";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guards";
import { RowDataPacket } from "mysql2";

export async function PATCH(
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
    const { isActive } = body;
    if (typeof isActive !== "boolean") {
      return errorResponse("VALIDATION_ERROR", "isActive must be a boolean", [], 400);
    }

    // Rule: An admin cannot deactivate themselves
    if (admin.userId === targetUserId && !isActive) {
      return errorResponse("FORBIDDEN", "Admins cannot deactivate their own account", [], 403);
    }

    // Check target user
    const [targetRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, email, role, is_active FROM app_user WHERE user_id = ?",
      [targetUserId]
    );
    const targetUser = targetRows[0];
    if (!targetUser) {
      return errorResponse("NOT_FOUND", "User not found", [], 404);
    }

    // Rule: The last active admin can never be deactivated
    if (targetUser.role === "ADMIN" && !isActive) {
      const [adminCountRows] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) as count FROM app_user WHERE role = 'ADMIN' AND is_active = TRUE"
      );
      if (adminCountRows[0].count <= 1) {
        return errorResponse("FORBIDDEN", "Cannot deactivate the last active administrator", [], 403);
      }
    }

    await pool.query("UPDATE app_user SET is_active = ? WHERE user_id = ?", [isActive, targetUserId]);

    await safeLogActivity(
      isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      "user",
      targetUserId,
      undefined,
      { targetEmail: targetUser.email, role: targetUser.role },
      { userId: admin.userId, role: admin.role, name: admin.name }
    );

    return successResponse({
      user_id: targetUserId,
      is_active: isActive,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
