import { z } from "zod";

export const vehicleSchema = z.object({
  vehicle_number: z
    .string()
    .min(3, "Vehicle number must be at least 3 characters")
    .max(20)
    .toUpperCase(),
  type: z.enum(["BIKE", "VAN", "TRUCK", "CONTAINER"], {
    error: "Type must be BIKE, VAN, TRUCK, or CONTAINER",
  }),
  status: z
    .enum(["AVAILABLE", "ON_TRIP", "MAINTENANCE"])
    .default("AVAILABLE"),
});

export const updateVehicleSchema = vehicleSchema.partial();

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
