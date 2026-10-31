import type { ApiResponse } from "./types";
// All callers reject failed requests before treating the payload as application data.
export async function apiFetch<T = unknown>(input: string, init?: RequestInit) {
  const response = await fetch(input, init);
  const json = await response.json() as ApiResponse<T>;
  if (!response.ok || !json.success) {
    const details = json.error?.details?.map(d => `${d.field}: ${d.message}`).join("; ");
    throw new Error(details || json.error?.message || `Request failed (${response.status})`);
  }
  return { ok: response.ok, json: async () => json };
}
