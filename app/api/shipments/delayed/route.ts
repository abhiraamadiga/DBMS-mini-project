import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getDelayedShipments } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

// Q3: Identify delayed shipments using expected delivery date (role-scoped)
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    let scoping: { customerId?: number; driverId?: number } | undefined;
    if (user.role === "CUSTOMER") {
      scoping = { customerId: user.customerId! };
    } else if (user.role === "DELIVERY_PARTNER") {
      scoping = { driverId: user.driverId! };
    }

    const delayed = await getDelayedShipments(scoping);
    return successResponse(delayed, { total: delayed.length });
  } catch (err) {
    return handleApiError(err);
  }
}

