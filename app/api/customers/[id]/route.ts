import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { updateCustomerSchema } from "@/lib/validators/customer";
import { getCustomerById, updateCustomer, deleteCustomer } from "@/lib/queries/customerQueries";
import { requireAuth } from "@/lib/auth/guards";

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

    return successResponse(customer);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return errorResponse("INVALID_ID", "Customer ID must be a number", [], 400);
    }

    const existing = await getCustomerById(customerId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Customer not found", [], 404);
    }

    const body = await request.json();
    const validated = updateCustomerSchema.parse(body);

    const updated = await updateCustomer(customerId, validated);

    await safeLogActivity(
      "CUSTOMER_UPDATED",
      "customer",
      customerId,
      undefined,
      { changes: validated },
      { userId: admin.userId, role: admin.role, name: admin.name }
    );

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
    const admin = await requireAuth(["ADMIN"]);
    const { id } = await params;
    const customerId = parseInt(id, 10);
    if (isNaN(customerId)) {
      return errorResponse("INVALID_ID", "Customer ID must be a number", [], 400);
    }

    const existing = await getCustomerById(customerId);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Customer not found", [], 404);
    }

    const deleted = await deleteCustomer(customerId);
    if (!deleted) {
      return errorResponse("DELETE_FAILED", "Failed to delete customer", [], 500);
    }

    await safeLogActivity("CUSTOMER_DELETED", "customer", customerId, undefined, {
      name: existing.name,
      email: existing.email,
    });

    return successResponse({ deleted: true, customerId });
  } catch (err) {
    return handleApiError(err);
  }
}
