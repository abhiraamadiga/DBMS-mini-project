import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { getPendingShipments } from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

// Q3: Identify pending shipments (not yet picked up / booked, role-scoped)
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    let scoping: { customerId?: number; driverId?: number } | undefined;
    if (user.role === "CUSTOMER") {
      scoping = { customerId: user.customerId! };
    } else if (user.role === "DELIVERY_PARTNER") {
      scoping = { driverId: user.driverId! };
    }

    const pending = await getPendingShipments(scoping);
    return successResponse(pending, { total: pending.length });
  } catch (err) {
    return handleApiError(err);
  }
}

