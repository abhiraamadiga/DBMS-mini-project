import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/api";
import { connectMongo } from "@/lib/db/mongo";
import ActivityLog from "@/lib/models/ActivityLog";
import { requireAuth } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 50)) : 50;
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const q = searchParams.get("q");

    await connectMongo();

    const query: any = {};
    if (action) {
      query.action = action;
    }
    if (entity) {
      query.entity = entity;
    }
    if (q) {
      query.$or = [
        { action: { $regex: q, $options: "i" } },
        { entity: { $regex: q, $options: "i" } },
        { trackingId: { $regex: q, $options: "i" } },
        { "actor.name": { $regex: q, $options: "i" } },
      ];
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return successResponse(logs, { limit, count: logs.length });
  } catch (err) {
    return handleApiError(err);
  }
}
