import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getShipmentById } from "@/lib/queries/shipmentQueries";

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

    return successResponse(shipment);
  } catch (err) {
    return handleApiError(err);
  }
}
