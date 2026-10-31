import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getVehicleById, getVehicleShipments } from "@/lib/queries/vehicleQueries";

// Q2: Find all shipments assigned to a particular vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const vehicleId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0 || vehicleId > 4294967295) {
      return errorResponse("INVALID_ID", "Vehicle ID must be a number", [], 400);
    }

    const vehicle = await getVehicleById(vehicleId);
    if (!vehicle) {
      return errorResponse("NOT_FOUND", "Vehicle not found", [], 404);
    }

    const shipments = await getVehicleShipments(vehicleId);
    return successResponse(shipments, { vehicle, total: shipments.length });
  } catch (err) {
    return handleApiError(err);
  }
}
