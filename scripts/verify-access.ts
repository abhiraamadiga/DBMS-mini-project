/**
 * Access and Role-Based Authorization Verification Script
 * Validates role-scoping, permission matrix, ownership 404s, and public tracking fields.
 * Run with: npm run verify:access
 */

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, expected: string, actual: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    results.push({ name, passed: true, expected, actual });
  } else {
    console.error(`  [FAIL] ${name} (Expected: ${expected}, Got: ${actual})`);
    results.push({ name, passed: false, expected, actual });
  }
}

async function loginAndGetCookie(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Login failed for ${email}: status ${res.status} - ${errText}`);
  }

  // Extract set-cookie header
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error(`No Set-Cookie header returned for ${email}`);
  }

  // Parse cookie token
  const match = setCookie.match(/slm_session=([^;]+)/);
  if (!match) {
    return setCookie.split(";")[0];
  }
  return `slm_session=${match[1]}`;
}

async function run() {
  console.log("==================================================================");
  console.log(`Starting Access Control & Permission Verification against ${BASE_URL}`);
  console.log("==================================================================");

  // 1. Unauthenticated checks
  console.log("\n[1] Testing Unauthenticated Access Guards:");
  {
    // GET /api/shipments without session -> 401
    const res = await fetch(`${BASE_URL}/api/shipments`);
    assert("Unauthenticated GET /api/shipments returns 401", res.status === 401, "401", String(res.status));

    // GET /api/customers without session -> 401
    const resCust = await fetch(`${BASE_URL}/api/customers`);
    assert("Unauthenticated GET /api/customers returns 401", resCust.status === 401, "401", String(resCust.status));

    // GET /api/activity-logs without session -> 401
    const resLogs = await fetch(`${BASE_URL}/api/activity-logs`);
    assert("Unauthenticated GET /api/activity-logs returns 401", resLogs.status === 401, "401", String(resLogs.status));

    // Public tracking limited fields
    const resTrack = await fetch(`${BASE_URL}/api/track/SLM2026000001`);
    assert("Public GET /api/track/:id returns 200", resTrack.status === 200, "200", String(resTrack.status));
    if (resTrack.ok) {
      const json = await resTrack.json();
      const data = json.data || {};
      const hasTrackingId = Boolean(data.tracking_id);
      const hasStatus = Boolean(data.current_status);
      const exposesCustomerName = "customer_name" in data;
      const exposesDriverName = "driver_name" in data;
      const exposesVehicleNumber = "vehicle_number" in data;

      assert("Public track returns tracking_id and status", hasTrackingId && hasStatus, "true", String(hasTrackingId && hasStatus));
      assert("Public track hides customer_name", !exposesCustomerName, "false", String(exposesCustomerName));
      assert("Public track hides driver_name", !exposesDriverName, "false", String(exposesDriverName));
      assert("Public track hides vehicle_number", !exposesVehicleNumber, "false", String(exposesVehicleNumber));
    }
  }

  // 2. Customer checks
  console.log("\n[2] Testing Customer Role Scoping & Guards:");
  try {
    const customerCookie = await loginAndGetCookie("aditi.sharma@example.com", "Customer@123");

    // GET /api/shipments should succeed
    const res = await fetch(`${BASE_URL}/api/shipments`, {
      headers: { Cookie: customerCookie },
    });
    assert("Customer GET /api/shipments returns 200", res.status === 200, "200", String(res.status));
    if (res.ok) {
      const json = await res.json();
      const list = json.data || [];
      const allOwned = list.every((s: any) => s.customer_id === 1);
      assert("Customer shipments strictly scoped to own customerId", allOwned && list.length > 0, "true", `allOwned=${allOwned}, count=${list.length}`);
    }

    // Customer GET /api/customers -> 403
    const resCust = await fetch(`${BASE_URL}/api/customers`, {
      headers: { Cookie: customerCookie },
    });
    assert("Customer GET /api/customers returns 403", resCust.status === 403, "403", String(resCust.status));

    // Customer GET /api/activity-logs -> 403
    const resLogs = await fetch(`${BASE_URL}/api/activity-logs`, {
      headers: { Cookie: customerCookie },
    });
    assert("Customer GET /api/activity-logs returns 403", resLogs.status === 403, "403", String(resLogs.status));

    // Customer accessing own shipment -> 200
    const resOwn = await fetch(`${BASE_URL}/api/shipments/1`, {
      headers: { Cookie: customerCookie },
    });
    assert("Customer GET own shipment /api/shipments/1 returns 200", resOwn.status === 200, "200", String(resOwn.status));

    // Customer accessing other customer's shipment -> 404 (ownership returns 404)
    const resOther = await fetch(`${BASE_URL}/api/shipments/7`, {
      headers: { Cookie: customerCookie },
    });
    assert("Customer GET foreign shipment returns 404 (enumeration protection)", resOther.status === 404, "404", String(resOther.status));

    // Customer attempting to add tracking events -> 403
    const resEvent = await fetch(`${BASE_URL}/api/shipments/1/events`, {
      method: "POST",
      headers: { Cookie: customerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_TRANSIT", location: "Hub" }),
    });
    assert("Customer POST /api/shipments/:id/events returns 403", resEvent.status === 403, "403", String(resEvent.status));
  } catch (err: any) {
    console.error("  [ERROR] Customer tests failed unexpectedly:", err.message);
    results.push({ name: "Customer test suite execution", passed: false, expected: "success", actual: err.message });
  }

  // 3. Delivery Partner checks
  console.log("\n[3] Testing Delivery Partner Role Scoping & Guards:");
  try {
    const partnerCookie = await loginAndGetCookie("rajesh.partner@smartlogistics.com", "Partner@123");

    // GET /api/shipments should succeed and be driver-scoped
    const res = await fetch(`${BASE_URL}/api/shipments`, {
      headers: { Cookie: partnerCookie },
    });
    assert("Partner GET /api/shipments returns 200", res.status === 200, "200", String(res.status));
    if (res.ok) {
      const json = await res.json();
      const list = json.data || [];
      const allAssigned = list.every((s: any) => s.driver_id === 1);
      assert("Partner shipments strictly scoped to driver_id = 1", allAssigned && list.length > 0, "true", `allAssigned=${allAssigned}, count=${list.length}`);
    }

    // Partner GET /api/customers -> 403
    const resCust = await fetch(`${BASE_URL}/api/customers`, {
      headers: { Cookie: partnerCookie },
    });
    assert("Partner GET /api/customers returns 403", resCust.status === 403, "403", String(resCust.status));

    // Partner GET /api/me/vehicles -> 200
    const resVeh = await fetch(`${BASE_URL}/api/me/vehicles`, {
      headers: { Cookie: partnerCookie },
    });
    assert("Partner GET /api/me/vehicles returns 200", resVeh.status === 200, "200", String(resVeh.status));

    // Partner attempting event on unassigned shipment -> 404
    const resEventUnassigned = await fetch(`${BASE_URL}/api/shipments/20/events`, {
      method: "POST",
      headers: { Cookie: partnerCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_TRANSIT", location: "Hub" }),
    });
    assert("Partner updating foreign shipment returns 404", resEventUnassigned.status === 404, "404", String(resEventUnassigned.status));
  } catch (err: any) {
    console.error("  [ERROR] Partner tests failed unexpectedly:", err.message);
    results.push({ name: "Partner test suite execution", passed: false, expected: "success", actual: err.message });
  }

  // 4. Admin checks
  console.log("\n[4] Testing Admin Full Access & Capabilities:");
  try {
    const adminCookie = await loginAndGetCookie("admin@smartlogistics.com", "Admin@123");

    // Admin GET /api/shipments -> 200
    const resShip = await fetch(`${BASE_URL}/api/shipments`, {
      headers: { Cookie: adminCookie },
    });
    assert("Admin GET /api/shipments returns 200", resShip.status === 200, "200", String(resShip.status));

    // Admin GET /api/customers -> 200
    const resCust = await fetch(`${BASE_URL}/api/customers`, {
      headers: { Cookie: adminCookie },
    });
    assert("Admin GET /api/customers returns 200", resCust.status === 200, "200", String(resCust.status));

    // Admin GET /api/users -> 200
    const resUsers = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: adminCookie },
    });
    assert("Admin GET /api/users returns 200", resUsers.status === 200, "200", String(resUsers.status));

    // Admin GET /api/activity-logs -> 200
    const resLogs = await fetch(`${BASE_URL}/api/activity-logs`, {
      headers: { Cookie: adminCookie },
    });
    assert("Admin GET /api/activity-logs returns 200", resLogs.status === 200, "200", String(resLogs.status));
  } catch (err: any) {
    console.error("  [ERROR] Admin tests failed unexpectedly:", err.message);
    results.push({ name: "Admin test suite execution", passed: false, expected: "success", actual: err.message });
  }

  // Summary
  console.log("\n==================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`VERIFICATION SUMMARY: ${passed}/${total} checks passed (${failed} failed).`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error(`\nVerification FAILED with ${failed} failing assertions.`);
    process.exit(1);
  } else {
    console.log("\nAll access guards, role-scoping rules, and permission policies PASSED.");
    process.exit(0);
  }
}

run().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
