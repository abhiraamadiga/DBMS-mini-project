import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { vehicleSchema } from "@/lib/validators/vehicle";
import { getVehicles, createVehicle } from "@/lib/queries/vehicleQueries";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const vehicles = await getVehicles({ q, status, type });
    return successResponse(vehicles, { total: vehicles.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const validated = vehicleSchema.parse(body);

    const newVehicle = await createVehicle(validated);
    if (!newVehicle) {
      return errorResponse("CREATE_FAILED", "Failed to create vehicle", [], 500);
    }

    await safeLogActivity("VEHICLE_CREATED", "vehicle", newVehicle.vehicle_id, undefined, {
      vehicle_number: newVehicle.vehicle_number,
      type: newVehicle.type,
      status: newVehicle.status,
    });

    return successResponse(newVehicle, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
