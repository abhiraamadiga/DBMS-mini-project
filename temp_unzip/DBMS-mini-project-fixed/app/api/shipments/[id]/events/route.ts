import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { addTrackingEventSchema } from "@/lib/validators/shipment";
import { getShipmentById, addTrackingEvent } from "@/lib/queries/shipmentQueries";

export async function GET(
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
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const shipmentId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(shipmentId) || shipmentId <= 0 || shipmentId > 4294967295) {
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
  } catch (err) {
    return handleApiError(err);
  }
}
