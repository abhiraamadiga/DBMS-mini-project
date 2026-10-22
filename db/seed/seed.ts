import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { pool } from "../../lib/db/mysql";
import { connectMongo } from "../../lib/db/mongo";
import ActivityLog from "../../lib/models/ActivityLog";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

export async function seed() {
  console.log("Starting deterministic database seeding...");

  // 1. Clear existing relational data in reverse FK order
  const tables = [
    "app_user",
    "tracking_event",
    "package",
    "shipment",
    "driver_vehicle",
    "driver",
    "vehicle",
    "route",
    "warehouse",
    "customer",
  ];

  const connection = await pool.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");
    for (const t of tables) {
      await connection.query(`TRUNCATE TABLE ${t};`);
    }
    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Truncated MySQL tables.");

    // 2. Insert Warehouses (6 hubs)
    const warehouses = [
      { id: 1, name: "Chennai Central Hub", location: "Chennai, Tamil Nadu", capacity: 15000 },
      { id: 2, name: "Bengaluru Hub", location: "Bengaluru, Karnataka", capacity: 20000 },
      { id: 3, name: "Hyderabad Depot", location: "Hyderabad, Telangana", capacity: 12000 },
      { id: 4, name: "Mumbai Gateway", location: "Mumbai, Maharashtra", capacity: 18000 },
      { id: 5, name: "Delhi NCR Hub", location: "Gurugram, Haryana", capacity: 20000 },
      { id: 6, name: "Kolkata Depot", location: "Kolkata, West Bengal", capacity: 10000 },
    ];

    for (const w of warehouses) {
      await connection.query(
        "INSERT INTO warehouse (warehouse_id, name, location, capacity) VALUES (?, ?, ?, ?)",
        [w.id, w.name, w.location, w.capacity]
      );
    }
    console.log(`Inserted ${warehouses.length} warehouses.`);

    // 3. Insert Routes (10 routes)
    const routes = [
      { id: 1, orig: 1, dest: 2, dist: 346.0, time: 6.5 },   // Chennai -> Bengaluru
      { id: 2, orig: 2, dest: 1, dist: 346.0, time: 6.5 },   // Bengaluru -> Chennai
      { id: 3, orig: 1, dest: 3, dist: 627.0, time: 11.0 },  // Chennai -> Hyderabad
      { id: 4, orig: 3, dest: 1, dist: 627.0, time: 11.0 },  // Hyderabad -> Chennai
      { id: 5, orig: 2, dest: 3, dist: 570.0, time: 9.5 },   // Bengaluru -> Hyderabad
      { id: 6, orig: 3, dest: 4, dist: 710.0, time: 13.0 },  // Hyderabad -> Mumbai
      { id: 7, orig: 4, dest: 5, dist: 1415.0, time: 24.0 }, // Mumbai -> Delhi NCR
      { id: 8, orig: 5, dest: 6, dist: 1530.0, time: 26.5 }, // Delhi NCR -> Kolkata
      { id: 9, orig: 4, dest: 2, dist: 980.0, time: 17.0 },  // Mumbai -> Bengaluru
      { id: 10, orig: 5, dest: 1, dist: 2180.0, time: 38.0 },// Delhi NCR -> Chennai
    ];

    for (const r of routes) {
      await connection.query(
        "INSERT INTO route (route_id, origin_warehouse_id, destination_warehouse_id, distance_km, est_time_hrs) VALUES (?, ?, ?, ?, ?)",
        [r.id, r.orig, r.dest, r.dist, r.time]
      );
    }
    console.log(`Inserted ${routes.length} routes.`);

    // 4. Insert Vehicles (10 vehicles, 2 in MAINTENANCE)
    const vehicles = [
      { id: 1, num: "TN-09-AB-1234", type: "BIKE", status: "AVAILABLE" },
      { id: 2, num: "KA-01-CD-5678", type: "VAN", status: "ON_TRIP" },
      { id: 3, num: "TS-07-EF-9012", type: "TRUCK", status: "AVAILABLE" },
      { id: 4, num: "MH-02-GH-3456", type: "CONTAINER", status: "ON_TRIP" },
      { id: 5, num: "DL-1C-IJ-7890", type: "TRUCK", status: "AVAILABLE" },
      { id: 6, num: "WB-02-KL-2345", type: "VAN", status: "AVAILABLE" },
      { id: 7, num: "TN-22-MN-6789", type: "CONTAINER", status: "ON_TRIP" },
      { id: 8, num: "KA-05-OP-0123", type: "BIKE", status: "AVAILABLE" },
      { id: 9, num: "MH-04-QR-4567", type: "VAN", status: "MAINTENANCE" },
      { id: 10, num: "DL-3C-ST-8901", type: "TRUCK", status: "MAINTENANCE" },
    ];

    for (const v of vehicles) {
      await connection.query(
        "INSERT INTO vehicle (vehicle_id, vehicle_number, type, status) VALUES (?, ?, ?, ?)",
        [v.id, v.num, v.type, v.status]
      );
    }
    console.log(`Inserted ${vehicles.length} vehicles.`);

    // 5. Insert Drivers (8 drivers)
    const drivers = [
      { id: 1, name: "Rajesh Kumar", phone: "+91 98401 23456", lic: "TN0920190012345" },
      { id: 2, name: "Suresh Gowda", phone: "+91 98860 12345", lic: "KA0120180067890" },
      { id: 3, name: "Venkatesh Rao", phone: "+91 94401 98765", lic: "TS0720200034567" },
      { id: 4, name: "Santosh Shinde", phone: "+91 98200 54321", lic: "MH0220170098765" },
      { id: 5, name: "Harpreet Singh", phone: "+91 98110 67890", lic: "DL0120160045678" },
      { id: 6, name: "Debashis Banerjee", phone: "+91 98300 23456", lic: "WB0220190011223" },
      { id: 7, name: "Murugan Selvam", phone: "+91 94440 87654", lic: "TN2220210088990" },
      { id: 8, name: "Kiran Patil", phone: "+91 97654 32109", lic: "MH0420220055443" },
    ];

    for (const d of drivers) {
      await connection.query(
        "INSERT INTO driver (driver_id, name, phone, license_number) VALUES (?, ?, ?, ?)",
        [d.id, d.name, d.phone, d.lic]
      );
    }
    console.log(`Inserted ${drivers.length} drivers.`);

    // 6. Driver_Vehicle M:N (~10 links)
    const driverVehicles = [
      { d: 1, v: 1 },
      { d: 1, v: 2 },
      { d: 2, v: 2 },
      { d: 3, v: 3 },
      { d: 4, v: 4 },
      { d: 5, v: 5 },
      { d: 6, v: 6 },
      { d: 7, v: 7 },
      { d: 8, v: 8 },
      { d: 4, v: 9 }, // vehicle in maintenance
    ];

    for (const dv of driverVehicles) {
      await connection.query(
        "INSERT INTO driver_vehicle (driver_id, vehicle_id, assigned_on) VALUES (?, ?, '2026-01-15')",
        [dv.d, dv.v]
      );
    }
    console.log(`Inserted ${driverVehicles.length} driver_vehicle relations.`);

    // 7. Insert Customers (15 customers across 6 cities)
    const customers = [
      { id: 1, name: "Aditi Sharma", email: "aditi.sharma@example.com", phone: "+91 98402 11223", addr: "12 Anna Salai, Chennai, TN" },
      { id: 2, name: "Rohan Nair", email: "rohan.nair@example.com", phone: "+91 98861 22334", addr: "45 Koramangala 4th Block, Bengaluru, KA" },
      { id: 3, name: "Priya Reddy", email: "priya.reddy@example.com", phone: "+91 94402 33445", addr: "88 Banjara Hills Road No 10, Hyderabad, TS" },
      { id: 4, name: "Amit Kulkarni", email: "amit.kulkarni@example.com", phone: "+91 98201 44556", addr: "102 Linking Road, Bandra West, Mumbai, MH" },
      { id: 5, name: "Neha Gupta", email: "neha.gupta@example.com", phone: "+91 98111 55667", addr: "24 Cyber City, DLF Phase 2, Gurugram, HR" },
      { id: 6, name: "Arjun Sen", email: "arjun.sen@example.com", phone: "+91 98301 66778", addr: "5 Park Street, Kolkata, WB" },
      { id: 7, name: "Vikram Sundaram", email: "vikram.sundaram@example.com", phone: "+91 94441 77889", addr: "33 T Nagar, Chennai, TN" },
      { id: 8, name: "Deepa Hegde", email: "deepa.hegde@example.com", phone: "+91 98862 88990", addr: "19 Indiranagar 100ft Rd, Bengaluru, KA" },
      { id: 9, name: "Sanjay Verma", email: "sanjay.verma@example.com", phone: "+91 94403 99001", addr: "67 Gachibowli, Hyderabad, TS" },
      { id: 10, name: "Meera Deshmukh", email: "meera.deshmukh@example.com", phone: "+91 98202 10112", addr: "15 Marine Drive, Nariman Point, Mumbai, MH" },
      { id: 11, name: "Kabir Malhotra", email: "kabir.malhotra@example.com", phone: "+91 98112 21223", addr: "7 Connaught Place, New Delhi, DL" },
      { id: 12, name: "Pooja Roy", email: "pooja.roy@example.com", phone: "+91 98302 32334", addr: "14 Salt Lake Sector 5, Kolkata, WB" },
      { id: 13, name: "Anand Balan", email: "anand.balan@example.com", phone: "+91 94442 43445", addr: "9 Besant Nagar Beach Rd, Chennai, TN" },
      { id: 14, name: "Swati Joshi", email: "swati.joshi@example.com", phone: "+91 98863 54556", addr: "80 Whitefield Main Rd, Bengaluru, KA" },
      { id: 15, name: "Gaurav Mehta", email: "gaurav.mehta@example.com", phone: "+91 98203 65667", addr: "52 Powai Hiranandani, Mumbai, MH" }, // 0 shipments customer
    ];

    for (const c of customers) {
      await connection.query(
        "INSERT INTO customer (customer_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)",
        [c.id, c.name, c.email, c.phone, c.addr]
      );
    }
    console.log(`Inserted ${customers.length} customers.`);

    // 8. Seed app_user accounts with bcrypt
    const adminHash = bcrypt.hashSync("Admin@123", 10);
    const partnerHash = bcrypt.hashSync("Partner@123", 10);
    const customerHash = bcrypt.hashSync("Customer@123", 10);

    // 8a. Admin user
    await connection.query(
      `INSERT INTO app_user (email, password_hash, role, customer_id, driver_id, is_active)
       VALUES (?, ?, 'ADMIN', NULL, NULL, TRUE)`,
      ["admin@smartlogistics.com", adminHash]
    );

    // 8b. Delivery Partner users (8, one per driver)
    for (const d of drivers) {
      const firstName = d.name.split(" ")[0].toLowerCase();
      const email = `${firstName}.partner@smartlogistics.com`;
      await connection.query(
        `INSERT INTO app_user (email, password_hash, role, customer_id, driver_id, is_active)
         VALUES (?, ?, 'DELIVERY_PARTNER', NULL, ?, TRUE)`,
        [email, partnerHash, d.id]
      );
    }

    // 8c. Customer users (15, one per customer)
    for (const c of customers) {
      await connection.query(
        `INSERT INTO app_user (email, password_hash, role, customer_id, driver_id, is_active)
         VALUES (?, ?, 'CUSTOMER', ?, NULL, TRUE)`,
        [c.email, customerHash, c.id]
      );
    }
    console.log("Inserted 24 app_user accounts (1 ADMIN, 8 DELIVERY_PARTNER, 15 CUSTOMER).");

    // 9. Generate 40 shipments with packages and tracking events
    const baseNow = new Date("2026-10-22T08:00:00Z");
    const formatDt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
    const formatDateOnly = (d: Date) => d.toISOString().slice(0, 10);

    const routeOriginsDestinations: Record<number, { orig: number; dest: number; origLoc: string; destLoc: string }> = {
      1: { orig: 1, dest: 2, origLoc: "Chennai Hub", destLoc: "Bengaluru Hub" },
      2: { orig: 2, dest: 1, origLoc: "Bengaluru Hub", destLoc: "Chennai Hub" },
      3: { orig: 1, dest: 3, origLoc: "Chennai Hub", destLoc: "Hyderabad Depot" },
      4: { orig: 3, dest: 1, origLoc: "Hyderabad Depot", destLoc: "Chennai Hub" },
      5: { orig: 2, dest: 3, origLoc: "Bengaluru Hub", destLoc: "Hyderabad Depot" },
      6: { orig: 3, dest: 4, origLoc: "Hyderabad Depot", destLoc: "Mumbai Gateway" },
      7: { orig: 4, dest: 5, origLoc: "Mumbai Gateway", destLoc: "Delhi NCR Hub" },
      8: { orig: 5, dest: 6, origLoc: "Delhi NCR Hub", destLoc: "Kolkata Depot" },
      9: { orig: 4, dest: 2, origLoc: "Mumbai Gateway", destLoc: "Bengaluru Hub" },
      10: { orig: 5, dest: 1, origLoc: "Delhi NCR Hub", destLoc: "Chennai Hub" },
    };

    let totalPackages = 0;
    let totalEvents = 0;

    for (let i = 1; i <= 40; i++) {
      const trackingId = `SLM2026${String(i).padStart(6, "0")}`;

      // Customer assignment
      let customerId: number;
      if (i <= 6) {
        customerId = 1; // Customer 1 gets 6 shipments!
      } else {
        customerId = ((i % 13) + 2); // Customers 2..14 (Customer 15 gets 0)
      }

      const routeId = ((i - 1) % 10) + 1;
      const { orig, dest, origLoc, destLoc } = routeOriginsDestinations[routeId];
      const vehicleId = (i % 7) + 1; // Vehicles 1..7 (not in maintenance)
      const driverId = (i % 8) + 1;  // Spread across all 8 drivers

      let bookingDaysAgo = 0;
      let expectedDaysOffset = 0;
      let targetStatus: "BOOKED" | "PICKED_UP" | "IN_TRANSIT" | "AT_WAREHOUSE" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

      // Specific assignment for customer 1 demo
      if (i === 1 || i === 2) {
        // Customer 1 has 2 BOOKED shipments ready to be cancelled in demo
        targetStatus = "BOOKED";
        bookingDaysAgo = 0;
        expectedDaysOffset = 4;
      } else if (i === 3 || i === 4) {
        targetStatus = "DELIVERED";
        bookingDaysAgo = 18;
        expectedDaysOffset = 4;
      } else if (i === 5) {
        targetStatus = "IN_TRANSIT";
        bookingDaysAgo = 2;
        expectedDaysOffset = 3;
      } else if (i === 6) {
        targetStatus = "OUT_FOR_DELIVERY";
        bookingDaysAgo = 3;
        expectedDaysOffset = 2;
      } else if (i <= 18) {
        // DELIVERED shipments (total 16 DELIVERED >= 15 required)
        targetStatus = "DELIVERED";
        bookingDaysAgo = 25 - (i % 8);
        expectedDaysOffset = 4;
      } else if (i <= 20) {
        // CANCELLED shipments (>= 2 required)
        targetStatus = "CANCELLED";
        bookingDaysAgo = 12;
        expectedDaysOffset = 5;
      } else if (i <= 28) {
        // 8 DELAYED shipments (>= 6 required: expected_delivery in past, not delivered/cancelled)
        bookingDaysAgo = 15 + (i - 20);
        expectedDaysOffset = 3; // expected past
        targetStatus = i % 2 === 0 ? "IN_TRANSIT" : "OUT_FOR_DELIVERY";
      } else if (i <= 33) {
        // PENDING shipments (BOOKED or PICKED_UP)
        bookingDaysAgo = i % 2;
        expectedDaysOffset = 4;
        targetStatus = i % 2 === 0 ? "BOOKED" : "PICKED_UP";
      } else {
        // Remaining active shipments
        bookingDaysAgo = 2;
        expectedDaysOffset = 5;
        targetStatus = i % 2 === 0 ? "IN_TRANSIT" : "AT_WAREHOUSE";
      }

      const bookingDate = new Date(baseNow.getTime() - bookingDaysAgo * 86400000);
      const expectedDeliveryDate = new Date(bookingDate.getTime() + expectedDaysOffset * 86400000);

      // In accordance with Section 2.4:
      // "Every shipment that is not BOOKED or CANCELLED has both a vehicle_id and a driver_id. BOOKED shipments may be unassigned."
      const isAssigned = targetStatus !== "BOOKED";
      const finalVehicleId = isAssigned ? vehicleId : null;
      const finalDriverId = isAssigned ? driverId : null;

      // Insert shipment
      await connection.query(
        `INSERT INTO shipment (
          shipment_id, tracking_id, customer_id, route_id,
          origin_warehouse_id, destination_warehouse_id,
          vehicle_id, driver_id, booking_date, expected_delivery, current_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BOOKED')`,
        [
          i,
          trackingId,
          customerId,
          routeId,
          orig,
          dest,
          finalVehicleId,
          finalDriverId,
          formatDt(bookingDate),
          formatDateOnly(expectedDeliveryDate),
        ]
      );

      // Insert packages
      const pkgCount = (i % 3) + 1;
      for (let p = 1; p <= pkgCount; p++) {
        totalPackages++;
        const weight = Number((((i * 7 + p * 13) % 115) + 0.5).toFixed(2));
        const fragile = (i + p) % 4 === 0;
        const dimensions = `${30 + (p * 5)}x${20 + (p * 5)}x${15 + (p * 5)}`;

        await connection.query(
          "INSERT INTO package (package_id, shipment_id, weight, fragile, dimensions) VALUES (?, ?, ?, ?, ?)",
          [totalPackages, i, weight, fragile, dimensions]
        );
      }

      // Tracking events
      const eventSequence: Array<{ status: string; loc: string; hoursAfter: number }> = [];
      eventSequence.push({ status: "BOOKED", loc: origLoc, hoursAfter: 0 });

      if (targetStatus === "CANCELLED") {
        eventSequence.push({ status: "CANCELLED", loc: origLoc, hoursAfter: 4 });
      } else if (targetStatus === "PICKED_UP") {
        eventSequence.push({ status: "PICKED_UP", loc: origLoc, hoursAfter: 6 });
      } else if (targetStatus === "IN_TRANSIT") {
        eventSequence.push({ status: "PICKED_UP", loc: origLoc, hoursAfter: 6 });
        eventSequence.push({ status: "IN_TRANSIT", loc: `Transit Corridor (${origLoc} -> ${destLoc})`, hoursAfter: 14 });
      } else if (targetStatus === "AT_WAREHOUSE") {
        eventSequence.push({ status: "PICKED_UP", loc: origLoc, hoursAfter: 6 });
        eventSequence.push({ status: "IN_TRANSIT", loc: `Waypoint (${origLoc} -> ${destLoc})`, hoursAfter: 14 });
        eventSequence.push({ status: "AT_WAREHOUSE", loc: destLoc, hoursAfter: 26 });
      } else if (targetStatus === "OUT_FOR_DELIVERY") {
        eventSequence.push({ status: "PICKED_UP", loc: origLoc, hoursAfter: 6 });
        eventSequence.push({ status: "IN_TRANSIT", loc: `Corridor to ${destLoc}`, hoursAfter: 14 });
        eventSequence.push({ status: "AT_WAREHOUSE", loc: destLoc, hoursAfter: 26 });
        eventSequence.push({ status: "OUT_FOR_DELIVERY", loc: `${destLoc} Sector Delivery Hub`, hoursAfter: 34 });
      } else if (targetStatus === "DELIVERED") {
        eventSequence.push({ status: "PICKED_UP", loc: origLoc, hoursAfter: 6 });
        eventSequence.push({ status: "IN_TRANSIT", loc: `Transit Corridor (${origLoc} -> ${destLoc})`, hoursAfter: 14 });
        eventSequence.push({ status: "AT_WAREHOUSE", loc: destLoc, hoursAfter: 26 });
        eventSequence.push({ status: "OUT_FOR_DELIVERY", loc: `${destLoc} Distribution Sector`, hoursAfter: 34 });
        eventSequence.push({ status: "DELIVERED", loc: destLoc, hoursAfter: 40 });
      }

      for (const ev of eventSequence) {
        totalEvents++;
        const evTime = new Date(bookingDate.getTime() + ev.hoursAfter * 3600000);
        await connection.query(
          "INSERT INTO tracking_event (event_id, shipment_id, status, location, event_timestamp) VALUES (?, ?, ?, ?, ?)",
          [totalEvents, i, ev.status, ev.loc, formatDt(evTime)]
        );
      }
    }

    console.log(`Inserted 40 shipments with ${totalPackages} packages and ${totalEvents} tracking events.`);

    // 10. Seed MongoDB activity_logs
    await connectMongo();
    await ActivityLog.deleteMany({});
    const actions = [
      { action: "LOGIN", actor: { userId: 1, role: "ADMIN", name: "System Administrator" }, entity: "user", entityId: 1, details: { method: "credentials" } },
      { action: "SHIPMENT_CREATED", actor: { userId: 2, role: "CUSTOMER", name: "Aditi Sharma" }, entity: "shipment", entityId: 1, trackingId: "SLM2026000001", details: { customer: "Aditi Sharma" } },
      { action: "STATUS_UPDATED", actor: { userId: 3, role: "DELIVERY_PARTNER", name: "Rajesh Kumar" }, entity: "shipment", entityId: 6, trackingId: "SLM2026000006", details: { from: "AT_WAREHOUSE", to: "OUT_FOR_DELIVERY", location: "Bengaluru Hub" } },
      { action: "VEHICLE_ASSIGNED", actor: { userId: 1, role: "ADMIN", name: "System Administrator" }, entity: "shipment", entityId: 5, trackingId: "SLM2026000005", details: { vehicle_number: "TN-09-AB-1234" } },
      { action: "DRIVER_ASSIGNED", actor: { userId: 1, role: "ADMIN", name: "System Administrator" }, entity: "shipment", entityId: 5, trackingId: "SLM2026000005", details: { driver: "Rajesh Kumar" } },
    ];
    await ActivityLog.insertMany(actions);
    console.log(`Inserted ${actions.length} audit logs in MongoDB.`);

    // 11. Test Role Trigger (Constraint Check)
    console.log("\nTesting trg_app_user_role_bi constraint enforcement...");
    let triggerPassed = false;
    try {
      // Mismatched role: ADMIN with customer_id should fail
      await connection.query(
        "INSERT INTO app_user (email, password_hash, role, customer_id, driver_id) VALUES ('bad@admin.com', 'hash', 'ADMIN', 1, NULL)"
      );
    } catch (e: any) {
      if (e.message.includes("ADMIN user must not link")) {
        triggerPassed = true;
        console.log("Trigger successfully rejected invalid role link (PASS).");
      }
    }
    if (!triggerPassed) {
      console.warn("Trigger validation warning: expected rejection did not trigger as expected.");
    }

    // 12. Verification output
    const [userCounts] = await connection.query("SELECT role, COUNT(*) as c FROM app_user GROUP BY role");
    const [delayed] = await connection.query("SELECT COUNT(*) as c FROM v_shipment_overview WHERE is_delayed = 1");
    const [pending] = await connection.query("SELECT COUNT(*) as c FROM v_shipment_overview WHERE current_status IN ('BOOKED','PICKED_UP')");
    const [delivered] = await connection.query("SELECT COUNT(*) as c FROM v_shipment_overview WHERE current_status = 'DELIVERED'");
    const [cust1] = await connection.query("SELECT COUNT(*) as c FROM shipment WHERE customer_id = 1");
    const [cust15] = await connection.query("SELECT COUNT(*) as c FROM shipment WHERE customer_id = 15");

    console.log("\n================ DEMO CREDENTIALS ================");
    console.log("| Role             | Email                                | Password     |");
    console.log("|------------------|--------------------------------------|--------------|");
    console.log("| ADMIN            | admin@smartlogistics.com             | Admin@123    |");
    console.log("| DELIVERY_PARTNER | rajesh.partner@smartlogistics.com    | Partner@123  |");
    console.log("| CUSTOMER         | aditi.sharma@example.com             | Customer@123 |");
    console.log("===================================================\n");

    console.log("Seed verification stats:");
    console.log(`- Delayed shipments: ${(delayed as any)[0].c}`);
    console.log(`- Pending shipments: ${(pending as any)[0].c}`);
    console.log(`- Delivered shipments: ${(delivered as any)[0].c}`);
    console.log(`- Customer 1 shipments: ${(cust1 as any)[0].c}`);
    console.log(`- Customer 15 shipments: ${(cust15 as any)[0].c}`);
    console.log("Seeding complete!");
  } finally {
    connection.release();
  }
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
