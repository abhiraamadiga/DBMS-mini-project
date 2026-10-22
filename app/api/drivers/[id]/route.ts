import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateDriverSchema } from "@/lib/validators/driver";
import { getDriverById, updateDriver, deleteDriver } from "@/lib/queries/driverQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);
    const { id } = await params;
    const driverId = parseInt(id, 10);
    if (isNaN(driverId)) {
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
  try {
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    const driverId = parseInt(id, 10);
    if (isNaN(driverId)) {
      return errorResponse("INVALID_ID", "Driver ID must be a number", [], 400);
    }

    const existing = await getDriverById(driverId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Driver not found", [], 404);
    }

    const body = await request.json();
    const validated = updateDriverSchema.parse(body);

    const updated = await updateDriver(driverId, validated);

    await safeLogActivity(
      "DRIVER_UPDATED",
      "driver",
      driverId,
      undefined,
      { changes: validated },
      { userId: admin.userId, role: admin.role, name: admin.name }
    );

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
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    const driverId = parseInt(id, 10);
    if (isNaN(driverId)) {
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
