import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateRouteSchema } from "@/lib/validators/route";
import { getRouteById, updateRoute, deleteRoute } from "@/lib/queries/routeQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const routeId = parseInt(id, 10);
    if (isNaN(routeId)) {
      return errorResponse("INVALID_ID", "Route ID must be a number", [], 400);
    }

    const route = await getRouteById(routeId);
    if (!route) {
      return errorResponse("NOT_FOUND", "Route not found", [], 404);
    }

    return successResponse(route);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);

    const { id } = await params;
    const routeId = parseInt(id, 10);
    if (isNaN(routeId)) {
      return errorResponse("INVALID_ID", "Route ID must be a number", [], 400);
    }

    const existing = await getRouteById(routeId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Route not found", [], 404);
    }

    const body = await request.json();
    const validated = updateRouteSchema.parse(body);

    const updated = await updateRoute(routeId, validated);

    await safeLogActivity("ROUTE_UPDATED", "route", routeId, undefined, {
      changes: validated,
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
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

    const existing = await getRouteById(routeId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Route not found", [], 404);
    }

    const deleted = await deleteRoute(routeId);
    if (!deleted) {
      return errorResponse("DELETE_FAILED", "Failed to delete route", [], 500);
    }

    await safeLogActivity("ROUTE_DELETED", "route", routeId, undefined, {
      origin_warehouse_id: existing.origin_warehouse_id,
      destination_warehouse_id: existing.destination_warehouse_id,
    });

    return successResponse({ deleted: true, routeId });
  } catch (err) {
    return handleApiError(err);
  }
}
