import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getShipmentById } from "@/lib/queries/shipmentQueries";

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

    return successResponse(shipment);
  } catch (err) {
    return handleApiError(err);
  }
}
