import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError } from "@/lib/api";
import { getCustomerById, getCustomerShipments } from "@/lib/queries/customerQueries";

// Q4: Retrieve a customer's complete shipment history and delivery status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const customerId = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(customerId) || customerId <= 0 || customerId > 4294967295) {
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
