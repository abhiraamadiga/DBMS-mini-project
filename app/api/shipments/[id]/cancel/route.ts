import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { getShipmentById, cancelShipment } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(["ADMIN", "CUSTOMER"]);

    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    // Role-based restrictions
    if (user.role === "CUSTOMER") {
      if (shipment.customer_id !== user.customerId) {
        return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
      }
      if (shipment.current_status !== "BOOKED") {
        return errorResponse(
          "INVALID_TRANSITION",
          `Customer can only cancel shipments in 'BOOKED' status (current status: '${shipment.current_status}')`,
          [],
          409
        );
      }
    } else if (user.role === "ADMIN") {
      if (["DELIVERED", "CANCELLED"].includes(shipment.current_status)) {
        return errorResponse(
          "INVALID_TRANSITION",
          `Cannot cancel shipment in terminal status '${shipment.current_status}'`,
          [],
          409
        );
      }
    }

    let cancelLocation = shipment.current_location || shipment.origin_name || "Warehouse Origin";
    try {
      const body = await request.json();
      if (body?.location) cancelLocation = body.location;
    } catch {
      // Body is optional
    }

    const result = await cancelShipment(shipmentId, cancelLocation);

    await safeLogActivity(
      "SHIPMENT_CANCELLED",
      "shipment",
      shipmentId,
      shipment.tracking_id,
      {
        cancelled_by_role: user.role,
        previous_status: shipment.current_status,
      },
      {
        userId: user.userId,
        role: user.role,
        name: user.name,
      }
    );

    return successResponse(result);
  } catch (err: any) {
    if (err.statusCode) {
      return errorResponse("CANCEL_FAILED", err.message, [], err.statusCode);
    }
    return handleApiError(err);
  }
}
