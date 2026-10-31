import { paginationParams } from "@/lib/validators/query";
import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { customerSchema } from "@/lib/validators/customer";
import { getCustomers, createCustomer } from "@/lib/queries/customerQueries";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = paginationParams(searchParams);
    const q = searchParams.get("q") || undefined;

    const result = await getCustomers({ page, limit, q });
    return successResponse(result.customers, result.pagination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const validated = customerSchema.parse(body);

    const newCustomer = await createCustomer(validated);
    if (!newCustomer) {
      return errorResponse("CREATE_FAILED", "Failed to create customer", [], 500);
    }

    await safeLogActivity("CUSTOMER_CREATED", "customer", newCustomer.customer_id, undefined, {
      name: newCustomer.name,
      email: newCustomer.email,
    });

    return successResponse(newCustomer, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
