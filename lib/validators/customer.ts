import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(120),
  phone: z.string().min(8, "Phone must be at least 8 digits").max(20),
  address: z.string().min(5, "Address must be at least 5 characters").max(255),
});

export const updateCustomerSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
