import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getShipmentByTrackingId } from "@/lib/queries/shipmentQueries";

// Q1: Track the current status and location of a shipment using its tracking ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    if (!trackingId || trackingId.trim().length === 0) {
      return errorResponse("INVALID_TRACKING_ID", "Tracking ID is required", [], 400);
    }

    const shipment = await getShipmentByTrackingId(trackingId.trim().toUpperCase());
    if (!shipment) {
      return errorResponse(
        "TRACKING_NOT_FOUND",
        `No shipment found with tracking ID '${trackingId}'`,
        [],
        404
      );
    }

    return successResponse(shipment);
  } catch (err) {
    return handleApiError(err);
  }
}
