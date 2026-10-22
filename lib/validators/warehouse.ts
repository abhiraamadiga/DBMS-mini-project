import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  location: z.string().min(2, "Location must be at least 2 characters").max(120),
  capacity: z.coerce.number().int().positive("Capacity must be greater than 0"),
});

export const updateWarehouseSchema = warehouseSchema.partial();

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
