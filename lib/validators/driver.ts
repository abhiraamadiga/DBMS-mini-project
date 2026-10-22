import { z } from "zod";

export const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(8, "Phone must be at least 8 digits").max(20),
  license_number: z.string().min(5, "License number must be at least 5 characters").max(30).toUpperCase(),
  vehicle_ids: z.array(z.coerce.number().int().positive()).optional(),
});

export const updateDriverSchema = driverSchema.partial();

export type DriverInput = z.infer<typeof driverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
