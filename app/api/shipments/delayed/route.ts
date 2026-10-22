import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getDelayedShipments } from "@/lib/queries/shipmentQueries";

// Q3: Identify delayed shipments using expected delivery date
export async function GET(_request: NextRequest) {
  try {
    const delayed = await getDelayedShipments();
    return successResponse(delayed, { total: delayed.length });
  } catch (err) {
    return handleApiError(err);
  }
}
