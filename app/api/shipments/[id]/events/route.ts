import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { addTrackingEventSchema } from "@/lib/validators/shipment";
import { getShipmentById, addTrackingEvent } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";
import { validateTransition } from "@/lib/shipment-flow";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    if (user.role === "CUSTOMER" && shipment.customer_id !== user.customerId) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    if (user.role === "DELIVERY_PARTNER" && shipment.driver_id !== user.driverId) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    return successResponse(shipment.timeline, { shipmentId, total: shipment.timeline.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(["ADMIN", "DELIVERY_PARTNER"]);

    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    // Delivery Partner can only update assigned shipments
    if (user.role === "DELIVERY_PARTNER" && shipment.driver_id !== user.driverId) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    const body = await request.json();
    const validated = addTrackingEventSchema.parse(body);

    // Validate transition rule & check assigned vehicle and driver if nextStatus is PICKED_UP
    const hasVehicleAndDriver = Boolean(shipment.vehicle_id && shipment.driver_id);
    const transitionResult = validateTransition(
      shipment.current_status,
      validated.status,
      user.role,
      hasVehicleAndDriver
    );

    if (!transitionResult.valid) {
      return errorResponse(
        "INVALID_TRANSITION",
        transitionResult.reason || "Invalid status transition",
        [{ allowed: transitionResult.allowed }],
        409
      );
    }

    const result = await addTrackingEvent(
      shipmentId,
      validated.status,
      validated.location
    );

    await safeLogActivity(
      "STATUS_UPDATED",
      "shipment",
      shipmentId,
      result.shipment?.tracking_id,
      {
        from_status: shipment.current_status,
        to_status: validated.status,
        location: validated.location,
      },
      {
        userId: user.userId,
        role: user.role,
        name: user.name,
      }
    );

    return successResponse(result, undefined, 201);
  } catch (err: any) {
    if (err.statusCode) {
      return errorResponse("EVENT_REJECTED", err.message, [], err.statusCode);
    }
    return handleApiError(err);
  }
}

