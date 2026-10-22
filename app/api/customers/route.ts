import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { customerSchema } from "@/lib/validators/customer";
import { getCustomers, createCustomer } from "@/lib/queries/customerQueries";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const q = searchParams.get("q") || undefined;

    const result = await getCustomers({ page, limit, q });
    return successResponse(result.customers, result.pagination);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth(["ADMIN"]);
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
