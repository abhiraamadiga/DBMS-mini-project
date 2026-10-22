import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getVehicleById, getVehicleShipments } from "@/lib/queries/vehicleQueries";
import { requireAuth } from "@/lib/auth/guards";

// Q2: Find all shipments assigned to a particular vehicle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);

    const { id } = await params;
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
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
