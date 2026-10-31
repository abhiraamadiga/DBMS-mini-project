import { authorizeAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { connectMongo } from "@/lib/db/mongo";
import ActivityLog from "@/lib/models/ActivityLog";

export async function GET(request: NextRequest) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20)) : 20;

    await connectMongo();
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(logs, { limit, count: logs.length });
  } catch (err) {
    return handleApiError(err);
  }
}
