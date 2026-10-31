import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getRouteById, getRouteShipments } from "@/lib/queries/routeQueries";

// Q2: Find all shipments assigned to a particular route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const routeId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(routeId) || routeId <= 0 || routeId > 4294967295) {
      return errorResponse("INVALID_ID", "Route ID must be a number", [], 400);
    }

    const route = await getRouteById(routeId);
    if (!route) {
      return errorResponse("NOT_FOUND", "Route not found", [], 404);
    }

    const shipments = await getRouteShipments(routeId);
    return successResponse(shipments, { route, total: shipments.length });
  } catch (err) {
    return handleApiError(err);
  }
}
