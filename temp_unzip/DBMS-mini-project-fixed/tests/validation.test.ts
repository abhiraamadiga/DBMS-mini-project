import { test } from "node:test";
import assert from "node:assert/strict";
import { createShipmentSchema, packageInputSchema } from "../lib/validators/shipment";
import { routeSchema } from "../lib/validators/route";
import { driverSchema } from "../lib/validators/driver";
import { authorizeAdmin } from "../lib/auth";
import { paginationParams, optionalId } from "../lib/validators/query";
import { apiFetch } from "../lib/client-api";

const valid = { weight: 1.25, fragile: false, dimensions: "40x30x20" };
test("package boundaries match SQL precision and column size", () => {
  assert.equal(packageInputSchema.safeParse(valid).success, true);
  for (const weight of [0, -1, 0.001, 1.234, 1000000, Infinity]) assert.equal(packageInputSchema.safeParse({ ...valid, weight }).success, false);
  for (const dimensions of ["0x0x0", "1x0x1", "-1x2x3", "1".repeat(31) + "x1x1"]) assert.equal(packageInputSchema.safeParse({ ...valid, dimensions }).success, false);
  assert.equal(packageInputSchema.safeParse({ ...valid, weight: 999999.99 }).success, true);
});
test("shipment accepts only real ISO calendar dates and at least one package", () => {
  const base = { customerId: 1, routeId: 1, packages: [valid] };
  for (const expectedDelivery of ["December 31, 2027", "2027-02-29", "2026-04-31", "2026-1-01", "0000-01-01"]) assert.equal(createShipmentSchema.safeParse({ ...base, expectedDelivery }).success, false);
  assert.equal(createShipmentSchema.safeParse({ ...base, expectedDelivery: "2028-02-29" }).success, true);
  assert.equal(createShipmentSchema.safeParse({ ...base, expectedDelivery: "2028-02-29", packages: [] }).success, false);
});
test("route precision and duplicate driver vehicles are rejected", () => {
  assert.equal(routeSchema.safeParse({ origin_warehouse_id: 1, destination_warehouse_id: 2, distance_km: 1, est_time_hrs: 1000 }).success, false);
  assert.equal(driverSchema.safeParse({ name: "Driver", phone: "1234567890", license_number: "LICENSE", vehicle_ids: [1, 1] }).success, false);
});
test("admin auth fails closed and rejects cross-site writes", () => {
  const previousUser = process.env.ADMIN_USERNAME;
  const previousPassword = process.env.ADMIN_PASSWORD;
  try {
    delete process.env.ADMIN_PASSWORD;
    assert.equal(authorizeAdmin(new Request("http://localhost/api/customers"))?.status, 503);
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "test-secret-for-regression";
    assert.equal(authorizeAdmin(new Request("http://localhost/api/customers"))?.status, 401);
    const authorization = `Basic ${Buffer.from("admin:test-secret-for-regression").toString("base64")}`;
    assert.equal(authorizeAdmin(new Request("http://localhost/api/customers", { headers: { authorization } })), null);
    assert.equal(authorizeAdmin(new Request("http://localhost/api/customers", { method: "POST", headers: { authorization, host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })), null);
    assert.equal(authorizeAdmin(new Request("http://localhost/api/customers", { method: "POST", headers: { authorization, origin: "https://foreign.example" } }))?.status, 403);
  } finally {
    if (previousUser === undefined) delete process.env.ADMIN_USERNAME; else process.env.ADMIN_USERNAME = previousUser;
    if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previousPassword;
  }
});
test("client rejects API errors instead of returning empty data", async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => Response.json({ success: false, error: { message: "Database unavailable" } }, { status: 500 });
    await assert.rejects(apiFetch("http://localhost/api/shipments"), /Database unavailable/);
  } finally { global.fetch = originalFetch; }
});

test("pagination defaults are numeric and malformed filters are rejected", () => {
  assert.deepEqual(paginationParams(new URLSearchParams()), { page: 1, limit: 10 });
  for (const query of ["page=1e3", "page=0", "limit=101", "page=Infinity", "page=999999999999999999999999"])
    assert.throws(() => paginationParams(new URLSearchParams(query)));
  assert.throws(() => optionalId(new URLSearchParams("driverId=abc"), "driverId"));
});
