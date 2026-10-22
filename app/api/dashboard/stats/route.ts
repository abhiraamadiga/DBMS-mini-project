import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getDashboardStats } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(_request: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const stats = await getDashboardStats();
    return successResponse(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
