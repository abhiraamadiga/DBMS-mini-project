import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { warehouseSchema } from "@/lib/validators/warehouse";
import { getWarehouses, createWarehouse } from "@/lib/queries/warehouseQueries";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;

    const warehouses = await getWarehouses({ q });
    return successResponse(warehouses, { total: warehouses.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const validated = warehouseSchema.parse(body);

    const newWarehouse = await createWarehouse(validated);
    if (!newWarehouse) {
      return errorResponse("CREATE_FAILED", "Failed to create warehouse", [], 500);
    }

    await safeLogActivity("WAREHOUSE_CREATED", "warehouse", newWarehouse.warehouse_id, undefined, {
      name: newWarehouse.name,
      location: newWarehouse.location,
      capacity: newWarehouse.capacity,
    });

    return successResponse(newWarehouse, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
