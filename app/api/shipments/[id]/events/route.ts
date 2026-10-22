import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { addTrackingEventSchema } from "@/lib/validators/shipment";
import { getShipmentById, addTrackingEvent } from "@/lib/queries/shipmentQueries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) {
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
    const { id } = await params;
    const shipmentId = parseInt(id, 10);
    if (isNaN(shipmentId)) {
      return errorResponse("INVALID_ID", "Shipment ID must be a number", [], 400);
    }

    const body = await request.json();
    const validated = addTrackingEventSchema.parse(body);

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
        to_status: validated.status,
        location: validated.location,
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
