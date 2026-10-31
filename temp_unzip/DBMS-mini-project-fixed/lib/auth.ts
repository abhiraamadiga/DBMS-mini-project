import { createHash, timingSafeEqual } from "node:crypto";

function equalSecret(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

/** Shared by Proxy and every private API handler; public tracking remains public. */
export function authorizeAdmin(request: Request): Response | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) {
    return Response.json({ success: false, error: { message: "Admin access is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD (at least 12 characters)." } }, { status: 503 });
  }
  const authorization = request.headers.get("authorization") || "";
  let credentials = "";
  if (authorization.startsWith("Basic ")) {
    credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  }
  if (!equalSecret(credentials, `${username}:${password}`)) {
    return Response.json({ success: false, error: { message: "Administrator sign-in required" } }, {
      status: 401, headers: { "WWW-Authenticate": 'Basic realm="Smart Logistics Admin", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }
  // Browser credentials must not authorize a cross-site mutation.
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host") || new URL(request.url).host;
    let originMatches = true;
    try { originMatches = !origin || new URL(origin).host === host; } catch { originMatches = false; }
    if (request.headers.get("sec-fetch-site") === "cross-site" || !originMatches) {
      return Response.json({ success: false, error: { message: "Cross-site writes are not allowed" } }, { status: 403 });
    }
  }
  return null;
}
