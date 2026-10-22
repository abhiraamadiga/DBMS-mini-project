import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { assignShipmentSchema } from "@/lib/validators/shipment";
import { assignShipment } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(["ADMIN"]);

    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const body = await request.json();
    const validated = assignShipmentSchema.parse(body);

    const updated = await assignShipment(
      shipmentId,
      validated.vehicleId,
      validated.driverId
    );

    const actor = {
      userId: admin.userId,
      role: admin.role,
      name: admin.name,
    };

    if (validated.vehicleId) {
      await safeLogActivity(
        "VEHICLE_ASSIGNED",
        "shipment",
        shipmentId,
        updated?.tracking_id,
        { vehicle_id: validated.vehicleId, vehicle_number: updated?.vehicle_number },
        actor
      );
    }

    if (validated.driverId) {
      await safeLogActivity(
        "DRIVER_ASSIGNED",
        "shipment",
        shipmentId,
        updated?.tracking_id,
        { driver_id: validated.driverId, driver_name: updated?.driver_name },
        actor
      );
    }

    return successResponse(updated);
  } catch (err: any) {
    if (err.statusCode) {
      return errorResponse("ASSIGNMENT_ERROR", err.message, [], err.statusCode);
    }
    return handleApiError(err);
  }
}
