import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  actor?: {
    userId?: number;
    role?: string;
    name?: string;
  };
  entity: string;
  entityId?: number | string;
  trackingId?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.Mixed,
      required: false,
      default: { role: "SYSTEM" },
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    trackingId: {
      type: String,
      required: false,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound and standalone indexes specified in Section 7
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ entity: 1, entityId: 1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema, "activity_logs");

export default ActivityLog;
