import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateWarehouseSchema } from "@/lib/validators/warehouse";
import { getWarehouseById, updateWarehouse, deleteWarehouse } from "@/lib/queries/warehouseQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const warehouseId = parseInt(id, 10);
    if (isNaN(warehouseId)) {
      return errorResponse("INVALID_ID", "Warehouse ID must be a number", [], 400);
    }

    const warehouse = await getWarehouseById(warehouseId);
    if (!warehouse) {
      return errorResponse("NOT_FOUND", "Warehouse not found", [], 404);
    }

    return successResponse(warehouse);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);

    const { id } = await params;
    const warehouseId = parseInt(id, 10);
    if (isNaN(warehouseId)) {
      return errorResponse("INVALID_ID", "Warehouse ID must be a number", [], 400);
    }

    const existing = await getWarehouseById(warehouseId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Warehouse not found", [], 404);
    }

    const body = await request.json();
    const validated = updateWarehouseSchema.parse(body);

    const updated = await updateWarehouse(warehouseId, validated);

    await safeLogActivity("WAREHOUSE_UPDATED", "warehouse", warehouseId, undefined, {
      changes: validated,
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);

    const { id } = await params;
    const warehouseId = parseInt(id, 10);
    if (isNaN(warehouseId)) {
      return errorResponse("INVALID_ID", "Warehouse ID must be a number", [], 400);
    }

    const existing = await getWarehouseById(warehouseId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Warehouse not found", [], 404);
    }

    const deleted = await deleteWarehouse(warehouseId);
    if (!deleted) {
      return errorResponse("DELETE_FAILED", "Failed to delete warehouse", [], 500);
    }

    await safeLogActivity("WAREHOUSE_DELETED", "warehouse", warehouseId, undefined, {
      name: existing.name,
      location: existing.location,
    });

    return successResponse({ deleted: true, warehouseId });
  } catch (err) {
    return handleApiError(err);
  }
}
