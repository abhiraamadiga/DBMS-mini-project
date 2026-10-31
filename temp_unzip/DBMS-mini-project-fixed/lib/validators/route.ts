import { z } from "zod";
import { decimalSchema } from "./common";

export const routeSchema = z
  .object({
    origin_warehouse_id: z.coerce.number().int().positive("Origin warehouse required"),
    destination_warehouse_id: z.coerce.number().int().positive("Destination warehouse required"),
    distance_km: decimalSchema(999999.99),
    est_time_hrs: decimalSchema(999.99),
  })
  .refine((data) => data.origin_warehouse_id !== data.destination_warehouse_id, {
    message: "Origin and destination warehouses cannot be the same",
    path: ["destination_warehouse_id"],
  });

export const updateRouteSchema = z.object({
  origin_warehouse_id: z.coerce.number().int().positive().optional(),
  destination_warehouse_id: z.coerce.number().int().positive().optional(),
  distance_km: decimalSchema(999999.99).optional(),
  est_time_hrs: decimalSchema(999.99).optional(),
});

export type RouteInput = z.infer<typeof routeSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
