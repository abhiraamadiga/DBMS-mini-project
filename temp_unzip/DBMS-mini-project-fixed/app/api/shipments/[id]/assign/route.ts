import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { assignShipmentSchema } from "@/lib/validators/shipment";
import { assignShipment } from "@/lib/queries/shipmentQueries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const shipmentId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(shipmentId) || shipmentId <= 0 || shipmentId > 4294967295) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const body = await request.json();
    const validated = assignShipmentSchema.parse(body);

    const updated = await assignShipment(
      shipmentId,
      validated.vehicleId,
      validated.driverId
    );

    if (validated.vehicleId !== undefined) {
      await safeLogActivity(
        "VEHICLE_ASSIGNED",
        "shipment",
        shipmentId,
        updated?.tracking_id,
        { vehicle_id: validated.vehicleId, vehicle_number: updated?.vehicle_number }
      );
    }

    if (validated.driverId !== undefined) {
      await safeLogActivity(
        "DRIVER_ASSIGNED",
        "shipment",
        shipmentId,
        updated?.tracking_id,
        { driver_id: validated.driverId, driver_name: updated?.driver_name }
      );
    }

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
