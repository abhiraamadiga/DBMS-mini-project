import { z } from "zod";
export const idSchema = z.coerce.number().int().positive().max(4294967295);
export const decimalSchema = (max: number) => z.coerce.number().min(0.01).max(max)
  .refine(n => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001, "Use at most two decimal places");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(s => s >= "1000-01-01" && s <= "9999-12-31" && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, "Enter a real calendar date");
