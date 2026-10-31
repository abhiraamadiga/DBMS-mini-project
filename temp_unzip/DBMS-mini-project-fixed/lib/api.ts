import { HttpError } from "./errors";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectMongo } from "./db/mongo";
import ActivityLog from "./models/ActivityLog";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
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
  details: unknown[] = [],
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

export function handleApiError(err: unknown) {
  console.error("API Error caught:", err);

  if (err instanceof HttpError) return errorResponse("REQUEST_REJECTED", err.message, [], err.statusCode);
  if (err instanceof SyntaxError) return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400);

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
    if (["ER_DATA_TOO_LONG", "ER_WARN_DATA_OUT_OF_RANGE", "ER_TRUNCATED_WRONG_VALUE"].includes(code)) {
      return errorResponse("INVALID_VALUE", "A value is outside the database limits", [], 400);
    }
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
  const message = "An unexpected server error occurred. Please try again.";
  return errorResponse("INTERNAL_SERVER_ERROR", message, [], 500);
}

export async function safeLogActivity(
  action: string,
  entity: string,
  entityId?: number | string,
  trackingId?: string,
  details?: Record<string, unknown>
) {
  try {
    await connectMongo();
    await ActivityLog.create({
      action,
      entity,
      entityId,
      trackingId,
      details: details || {},
      createdAt: new Date(),
    });
  } catch (logErr) {
    console.warn("Failed to write Mongo activity log (non-fatal):", logErr);
  }
}
