import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getRouteById, getRouteShipments } from "@/lib/queries/routeQueries";
import { requireAuth } from "@/lib/auth/guards";

// Q2: Find all shipments assigned to a particular route
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);

    const { id } = await params;
    const routeId = parseInt(id, 10);
    if (isNaN(routeId)) {
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
