import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateVehicleSchema } from "@/lib/validators/vehicle";
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/queries/vehicleQueries";

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

    return successResponse(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
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

    const existing = await getVehicleById(vehicleId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Vehicle not found", [], 404);
    }

    const body = await request.json();
    const validated = updateVehicleSchema.parse(body);

    const updated = await updateVehicle(vehicleId, validated);

    await safeLogActivity("VEHICLE_UPDATED", "vehicle", vehicleId, undefined, {
      changes: validated,
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
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

    const existing = await getVehicleById(vehicleId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Vehicle not found", [], 404);
    }

    const deleted = await deleteVehicle(vehicleId);
    if (!deleted) {
      return errorResponse("DELETE_FAILED", "Failed to delete vehicle", [], 500);
    }

    await safeLogActivity("VEHICLE_DELETED", "vehicle", vehicleId, undefined, {
      vehicle_number: existing.vehicle_number,
    });

    return successResponse({ deleted: true, vehicleId });
  } catch (err) {
    return handleApiError(err);
  }
}
