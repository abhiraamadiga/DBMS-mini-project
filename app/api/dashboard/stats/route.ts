import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getDashboardStats } from "@/lib/queries/shipmentQueries";

export async function GET(_request: NextRequest) {
  try {
    const stats = await getDashboardStats();
    return successResponse(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
