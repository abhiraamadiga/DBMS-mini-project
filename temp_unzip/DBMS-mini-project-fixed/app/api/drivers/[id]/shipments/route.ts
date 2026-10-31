import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getDriverById, getDriverShipments } from "@/lib/queries/driverQueries";

// Q2: Find all shipments assigned to a particular driver
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

    const shipments = await getDriverShipments(driverId);
    return successResponse(shipments, { driver, total: shipments.length });
  } catch (err) {
    return handleApiError(err);
  }
}
