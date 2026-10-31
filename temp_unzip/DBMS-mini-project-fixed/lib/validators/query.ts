import { z } from "zod";
const positiveInteger = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(4294967295));
export const paginationSchema = z.object({
  page: positiveInteger.prefault("1"),
  limit: positiveInteger.pipe(z.number().max(100)).prefault("10"),
});
export function paginationParams(params: URLSearchParams) {
  return paginationSchema.parse({ page: params.get("page") ?? undefined, limit: params.get("limit") ?? undefined });
}
export function optionalId(params: URLSearchParams, name: string) {
  const value = params.get(name);
  return value === null ? undefined : positiveInteger.parse(value);
}
