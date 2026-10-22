import { z } from "zod";

export const packageInputSchema = z.object({
  weight: z.coerce.number().positive("Weight must be greater than 0 kg"),
  fragile: z.boolean().default(false),
  dimensions: z
    .string()
    .min(3, "Dimensions format LxWxH")
    .regex(/^\d+x\d+x\d+$/, "Dimensions must follow LxWxH format in cm (e.g. 40x30x20)"),
});

export const shipmentStatusEnum = z.enum([
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_WAREHOUSE",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export const createShipmentSchema = z.object({
  customerId: z.coerce.number().int().positive("Customer is required"),
  routeId: z.coerce.number().int().positive("Route is required"),
  expectedDelivery: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Valid expected delivery date required"),
  vehicleId: z.coerce.number().int().positive().nullable().optional(),
  driverId: z.coerce.number().int().positive().nullable().optional(),
  packages: z
    .array(packageInputSchema)
    .min(1, "At least one package is required for a shipment"),
});

export const assignShipmentSchema = z.object({
  vehicleId: z.coerce.number().int().positive().nullable().optional(),
  driverId: z.coerce.number().int().positive().nullable().optional(),
});

export const addTrackingEventSchema = z.object({
  status: shipmentStatusEnum,
  location: z.string().min(2, "Location must be at least 2 characters").max(120),
});

export type PackageInput = z.infer<typeof packageInputSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type AssignShipmentInput = z.infer<typeof assignShipmentSchema>;
export type AddTrackingEventInput = z.infer<typeof addTrackingEventSchema>;
