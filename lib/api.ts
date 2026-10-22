import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectMongo } from "./db/mongo";
import ActivityLog from "./models/ActivityLog";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
}

export function successResponse<T>(data: T, meta?: ApiMeta, status: number = 200) {
  const body: { success: true; data: T; meta?: ApiMeta } = {
    success: true,
    data,
  };
  if (meta !== undefined) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status });
}

export function errorResponse(
  code: string,
  message: string,
  details: any[] = [],
  status: number = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function handleApiError(err: any) {
  console.error("API Error caught:", err);

  // 0. Auth and Domain errors with status codes
  if (err && typeof err === "object" && "statusCode" in err && "code" in err) {
    return errorResponse(err.code, err.message, [], err.statusCode);
  }

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return errorResponse("VALIDATION_ERROR", "Invalid request payload", details, 400);
  }

  // 2. MySQL Error Mapping
  if (err && typeof err === "object" && "code" in err) {
    const code = err.code as string;
    if (code === "ER_DUP_ENTRY") {
      return errorResponse("DUPLICATE_ENTRY", "A record with this unique identifier already exists", [], 409);
    }
    if (code === "ER_ROW_IS_REFERENCED_2" || code === "ER_NO_REFERENCED_ROW_2") {
      return errorResponse(
        "FOREIGN_KEY_CONFLICT",
        "Cannot delete or update: record is referenced by existing shipments or operations",
        [],
        409
      );
    }
    if (code === "ER_CHECK_CONSTRAINT_VIOLATED") {
      return errorResponse("CONSTRAINT_VIOLATION", "Database check constraint violated", [], 400);
    }
  }

  // 3. Fallback generic internal error
  const message = err instanceof Error ? err.message : "An unexpected server error occurred";
  return errorResponse("INTERNAL_SERVER_ERROR", message, [], 500);
}

export async function safeLogActivity(
  action: string,
  entity: string,
  entityId?: number | string,
  trackingId?: string,
  details?: Record<string, any>,
  actor?: { userId?: number; role?: string; name?: string }
) {
  try {
    await connectMongo();
    await ActivityLog.create({
      action,
      entity,
      entityId,
      trackingId,
      details: details || {},
      actor: actor || { role: "SYSTEM" },
      createdAt: new Date(),
    });
  } catch (logErr) {
    console.warn("Failed to write Mongo activity log (non-fatal):", logErr);
  }
}
