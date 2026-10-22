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

    const publicData = {
      tracking_id: shipment.tracking_id,
      current_status: shipment.current_status,
      current_location: shipment.current_location,
      origin_name: shipment.origin_name,
      origin_location: shipment.origin_location,
      destination_name: shipment.destination_name,
      destination_location: shipment.destination_location,
      expected_delivery: shipment.expected_delivery,
      booking_date: shipment.booking_date,
      is_delayed: Boolean(shipment.is_delayed),
      package_count: shipment.packages?.length || 0,
      timeline:
        shipment.timeline?.map((evt: any) => ({
          status: evt.status,
          location: evt.location,
          event_timestamp: evt.event_timestamp,
        })) || [],
    };

    return successResponse(publicData);
  } catch (err) {
    return handleApiError(err);
  }
}
