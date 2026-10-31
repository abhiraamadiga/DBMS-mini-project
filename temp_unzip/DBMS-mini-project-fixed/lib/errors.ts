export class HttpError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}
