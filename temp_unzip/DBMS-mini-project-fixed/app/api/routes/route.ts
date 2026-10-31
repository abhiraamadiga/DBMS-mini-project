import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { routeSchema } from "@/lib/validators/route";
import { getRoutes, createRoute } from "@/lib/queries/routeQueries";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;

    const routes = await getRoutes({ q });
    return successResponse(routes, { total: routes.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const validated = routeSchema.parse(body);

    const newRoute = await createRoute(validated);
    if (!newRoute) {
      return errorResponse("CREATE_FAILED", "Failed to create route", [], 500);
    }

    await safeLogActivity("ROUTE_CREATED", "route", newRoute.route_id, undefined, {
      origin_warehouse_id: newRoute.origin_warehouse_id,
      destination_warehouse_id: newRoute.destination_warehouse_id,
      distance_km: newRoute.distance_km,
    });

    return successResponse(newRoute, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
