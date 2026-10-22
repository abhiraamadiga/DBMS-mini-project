import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { createShipmentSchema } from "@/lib/validators/shipment";
import { getShipments, createShipment } from "@/lib/queries/shipmentQueries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const delayed = searchParams.get("delayed") === "true";
    const customerId = searchParams.get("customerId")
      ? parseInt(searchParams.get("customerId")!, 10)
      : undefined;
    const vehicleId = searchParams.get("vehicleId")
      ? parseInt(searchParams.get("vehicleId")!, 10)
      : undefined;
    const driverId = searchParams.get("driverId")
      ? parseInt(searchParams.get("driverId")!, 10)
      : undefined;
    const routeId = searchParams.get("routeId")
      ? parseInt(searchParams.get("routeId")!, 10)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

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
    const body = await request.json();
    const validated = createShipmentSchema.parse(body);

    const newShipment = await createShipment(validated);
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
