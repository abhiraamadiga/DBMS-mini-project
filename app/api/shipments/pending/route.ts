import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getPendingShipments } from "@/lib/queries/shipmentQueries";

// Q3: Identify pending shipments (not yet picked up / booked)
export async function GET(_request: NextRequest) {
  try {
    const pending = await getPendingShipments();
    return successResponse(pending, { total: pending.length });
  } catch (err) {
    return handleApiError(err);
  }
}
