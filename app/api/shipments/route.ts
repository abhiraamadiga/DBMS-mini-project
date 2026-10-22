import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { createShipmentSchema } from "@/lib/validators/shipment";
import {
  getShipments,
  createShipment,
  calculateExpectedDelivery,
} from "@/lib/queries/shipmentQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const delayed = searchParams.get("delayed") === "true";
    let customerId = searchParams.get("customerId")
      ? parseInt(searchParams.get("customerId")!, 10)
      : undefined;
    let driverId = searchParams.get("driverId")
      ? parseInt(searchParams.get("driverId")!, 10)
      : undefined;
    const vehicleId = searchParams.get("vehicleId")
      ? parseInt(searchParams.get("vehicleId")!, 10)
      : undefined;
    const routeId = searchParams.get("routeId")
      ? parseInt(searchParams.get("routeId")!, 10)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Role-based scoping
    if (user.role === "CUSTOMER") {
      customerId = user.customerId!;
    } else if (user.role === "DELIVERY_PARTNER") {
      driverId = user.driverId!;
    }

    const result = await getShipments({
      q,
      status,
      delayed,
      customerId,
      vehicleId,
      driverId,
      routeId,
      page,
      limit,
    });

    return successResponse(result.shipments, result.pagination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["ADMIN", "CUSTOMER"]);
    const body = await request.json();
    const validated = createShipmentSchema.parse(body);

    let customerId: number;
    let expectedDelivery: string;
    let vehicleId = validated.vehicleId || null;
    let driverId = validated.driverId || null;

    if (user.role === "CUSTOMER") {
      // Customer is forced to self, cannot assign vehicle/driver, and expected delivery is calculated
      if (!user.customerId) {
        return errorResponse("FORBIDDEN", "User not linked to customer record", [], 403);
      }
      customerId = user.customerId;
      vehicleId = null;
      driverId = null;
      expectedDelivery = await calculateExpectedDelivery(validated.routeId);
    } else {
      // ADMIN can choose customer and optionally override expected delivery
      if (!validated.customerId) {
        return errorResponse("VALIDATION_ERROR", "customerId is required for admin bookings", [], 400);
      }
      customerId = validated.customerId;
      expectedDelivery = validated.expectedDelivery
        ? validated.expectedDelivery
        : await calculateExpectedDelivery(validated.routeId);
    }

    const newShipment = await createShipment({
      ...validated,
      customerId,
      expectedDelivery,
      vehicleId,
      driverId,
    });

    if (!newShipment) {
      return errorResponse("CREATE_FAILED", "Failed to create shipment", [], 500);
    }

    await safeLogActivity(
      "SHIPMENT_CREATED",
      "shipment",
      newShipment.shipment_id,
      newShipment.tracking_id,
      {
        customer_id: newShipment.customer_id,
        customer_name: newShipment.customer_name,
        origin: newShipment.origin_name,
        destination: newShipment.destination_name,
        packages_count: newShipment.packages?.length || 1,
      },
      {
        userId: user.userId,
        role: user.role,
        name: user.name,
      }
    );

    return successResponse(newShipment, undefined, 201);
  } catch (err: any) {
    if (err.statusCode) {
      return errorResponse("BAD_REQUEST", err.message, [], err.statusCode);
    }
    return handleApiError(err);
  }
}

