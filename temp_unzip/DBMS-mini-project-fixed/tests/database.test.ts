import { test } from "node:test";
import assert from "node:assert/strict";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import mongoose from "mongoose";
import pool from "../lib/db/mysql";
import { runMigrations } from "../db/migrate";
import { createShipment, addTrackingEvent, getShipmentById, getDashboardStats, assignShipment } from "../lib/queries/shipmentQueries";
import { updateRoute } from "../lib/queries/routeQueries";
import { getCustomers } from "../lib/queries/customerQueries";

// Opt-in: this suite clears only a deliberately named test database.
test("database regressions", { skip: process.env.RUN_DB_TESTS !== "1" }, async t => {
  const database = process.env.MYSQL_DATABASE || "";
  assert.match(database, /^(test_[a-zA-Z0-9_]+|logistics_test)$/);
  try {
    await runMigrations();
    await runMigrations(); // Re-running must not fail or drop data.
    const conn = await pool.getConnection();
    try {
      await conn.query("SET FOREIGN_KEY_CHECKS = 0");
      for (const table of ["tracking_event", "package", "shipment", "driver_vehicle", "driver", "vehicle", "route", "warehouse", "customer"]) await conn.query(`TRUNCATE TABLE ${table}`);
    } finally { await conn.query("SET FOREIGN_KEY_CHECKS = 1"); conn.release(); }
    await pool.query("INSERT INTO customer(name,email,phone,address) VALUES ('Test customer','test@example.com','1234567890','Test address')");
    await pool.query("INSERT INTO warehouse(name,location,capacity) VALUES (?, ?, 1), ('Destination','Destination location',1), ('Alternate','Alternate location',1)", ["N".repeat(100), "L".repeat(120)]);
    await pool.query("INSERT INTO route(origin_warehouse_id,destination_warehouse_id,distance_km,est_time_hrs) VALUES (1,2,100,2)");
    await pool.query("INSERT INTO driver(name,phone,license_number) VALUES ('Busy','1234567890','BUSY001'),('Free','1234567890','FREE001')");
    await pool.query("INSERT INTO vehicle(vehicle_number,type,status) VALUES ('TEST001','TRUCK','AVAILABLE'),('TEST002','VAN','MAINTENANCE')");
    const [dates] = await pool.query<RowDataPacket[]>("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
    const input = { customerId: 1, routeId: 1, expectedDelivery: dates[0].today as string, packages: [{ weight: 1.25, fragile: false, dimensions: "40x30x20" }], driverId: 1, vehicleId: 1 };
    let shipmentId = 0;
    await t.test("long warehouse location books successfully with package and first event", async () => {
      const shipment = await createShipment(input);
      assert.ok(shipment); shipmentId = shipment.shipment_id;
      assert.equal(shipment.packages.length, 1);
      assert.equal(shipment.timeline.length, 1);
      assert.equal(shipment.current_location?.length, 120);
      assert.equal(shipment.expected_delivery, input.expectedDelivery);
    });
    await t.test("route endpoints stay consistent and distances remain editable", async () => {
      await assert.rejects(updateRoute(1, { destination_warehouse_id: 3 }), /has shipments/);
      const updated = await updateRoute(1, { distance_km: 150 });
      assert.equal(updated?.distance_km, 150);
      assert.equal(updated?.destination_warehouse_id, 2);
    });
    await t.test("invalid package insert rolls back the entire booking", async () => {
      const [before] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM shipment");
      await assert.rejects(createShipment({ ...input, packages: [{ ...input.packages[0], weight: 0 }] }));
      const [after] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM shipment");
      assert.equal(after[0].n, before[0].n);
    });
    await t.test("maintenance vehicles cannot be assigned or booked", async () => {
      await assert.rejects(createShipment({ ...input, vehicleId: 2 }), /MAINTENANCE/);
      await assert.rejects(assignShipment(shipmentId, 2), /MAINTENANCE/);
    });
    await t.test("available-driver count excludes active assignments", async () => {
      const stats = await getDashboardStats();
      assert.equal(stats.availableDrivers, 1);
    });
    await t.test("concurrent events cannot reopen delivered shipments", async () => {
      const outcomes = await Promise.allSettled([
        addTrackingEvent(shipmentId, "DELIVERED", "Destination"),
        ...Array.from({ length: 8 }, () => addTrackingEvent(shipmentId, "IN_TRANSIT", "Transit")),
      ]);
      assert.equal(outcomes[0].status, "fulfilled");
      const shipment = await getShipmentById(shipmentId);
      assert.equal(shipment?.current_status, "DELIVERED");
      assert.equal(shipment?.timeline.at(-1)?.status, "DELIVERED");
      await assert.rejects(addTrackingEvent(shipmentId, "BOOKED", "Origin"), /terminal/);
    });
    await t.test("pagination and search can retrieve customers beyond 100", async () => {
      for (let n = 2; n <= 105; n++) await pool.query<ResultSetHeader>("INSERT INTO customer(name,email,phone,address) VALUES (?,?,'1234567890','Test address')", [`Customer ${n}`, `customer${n}@example.com`]);
      const first = await getCustomers({ page: 1, limit: 100 });
      const second = await getCustomers({ page: 2, limit: 100 });
      assert.equal(first.customers.length, 100);
      assert.equal(second.customers.length, 5);
      assert.ok(second.customers.some(c => c.customer_id === 1));
      assert.equal((await getCustomers({ q: "test@example.com" })).customers[0].customer_id, 1);
    });
  } finally { await pool.end(); await mongoose.disconnect(); }
});
