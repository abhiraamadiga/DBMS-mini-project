import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getDashboardStats } from "@/lib/queries/shipmentQueries";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const stats = await getDashboardStats();
    return successResponse(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
