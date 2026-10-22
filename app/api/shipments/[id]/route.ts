import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getShipmentById } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

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

    // Role-based scoping (return 404 to prevent enumeration)
    if (user.role === "CUSTOMER" && shipment.customer_id !== user.customerId) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    if (user.role === "DELIVERY_PARTNER" && shipment.driver_id !== user.driverId) {
      return errorResponse("NOT_FOUND", "Shipment not found", [], 404);
    }

    return successResponse(shipment);
  } catch (err) {
    return handleApiError(err);
  }
}

