import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getCustomerById, getCustomerShipments } from "@/lib/queries/customerQueries";
import { requireAuth } from "@/lib/auth/guards";

// Q4: Retrieve a customer's complete shipment history and delivery status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return errorResponse("INVALID_ID", "Customer ID must be a number", [], 400);
    }

    const customer = await getCustomerById(customerId);
    if (!customer) {
      return errorResponse("NOT_FOUND", "Customer not found", [], 404);
    }

    const shipments = await getCustomerShipments(customerId);
    return successResponse(shipments, { customer, total: shipments.length });
  } catch (err) {
    return handleApiError(err);
  }
}
