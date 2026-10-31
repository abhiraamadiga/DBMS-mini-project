import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateDriverSchema } from "@/lib/validators/driver";
import { getDriverById, updateDriver, deleteDriver } from "@/lib/queries/driverQueries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const driverId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(driverId) || driverId <= 0 || driverId > 4294967295) {
      return errorResponse("INVALID_ID", "Driver ID must be a number", [], 400);
    }

    const driver = await getDriverById(driverId);
    if (!driver) {
      return errorResponse("NOT_FOUND", "Driver not found", [], 404);
    }

    return successResponse(driver);
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
    const driverId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(driverId) || driverId <= 0 || driverId > 4294967295) {
      return errorResponse("INVALID_ID", "Driver ID must be a number", [], 400);
    }

    const existing = await getDriverById(driverId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Driver not found", [], 404);
    }

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);

    const updated = await updateDriver(driverId, validated);

    await safeLogActivity("DRIVER_UPDATED", "driver", driverId, undefined, {
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
    const driverId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(driverId) || driverId <= 0 || driverId > 4294967295) {
      return errorResponse("INVALID_ID", "Driver ID must be a number", [], 400);
    }

    const existing = await getDriverById(driverId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Driver not found", [], 404);
    }

    const deleted = await deleteDriver(driverId);
    if (!deleted) {
      return errorResponse("DELETE_FAILED", "Failed to delete driver", [], 500);
    }

    await safeLogActivity("DRIVER_DELETED", "driver", driverId, undefined, {
      name: existing.name,
      license_number: existing.license_number,
    });

    return successResponse({ deleted: true, driverId });
  } catch (err) {
    return handleApiError(err);
  }
}
