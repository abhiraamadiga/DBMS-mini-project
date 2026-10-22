import { NextRequest } from "next/server";
import { successResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { clearSessionCookie, getSession } from "@/lib/auth/session";

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      await safeLogActivity(
        "LOGOUT",
        "user",
        session.userId,
        undefined,
        { email: session.email },
        { userId: session.userId, role: session.role, name: session.name }
      );
    }
    await clearSessionCookie();
    return successResponse({ message: "Logged out successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
