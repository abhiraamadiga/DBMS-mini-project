import { NextRequest } from "next/server";
import { successResponse, errorResponse, handleApiError, safeLogActivity } from "@/lib/api";
import { driverSchema } from "@/lib/validators/driver";
import { getDrivers, createDriver } from "@/lib/queries/driverQueries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;

    const drivers = await getDrivers({ q });
    return successResponse(drivers, { total: drivers.length });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = driverSchema.parse(body);

    const newDriver = await createDriver(validated);
    if (!newDriver) {
      return errorResponse("CREATE_FAILED", "Failed to create driver", [], 500);
    }

    await safeLogActivity("DRIVER_CREATED", "driver", newDriver.driver_id, undefined, {
      name: newDriver.name,
      license_number: newDriver.license_number,
    });

    return successResponse(newDriver, undefined, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
