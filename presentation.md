# Smart Logistics — SQL and NoSQL teacher demonstration

**Presenter:** ____________________  
**Suggested length:** 12–15 minutes  
**Based on:** the corrected DBMS-mini-project-fixed project

## 1. Your opening explanation — 30 seconds

> “My project is a Smart Logistics and Shipment Management System. An administrator manages customers, warehouses, routes, vehicles, drivers and shipments. Customers can track a shipment using its tracking ID. MySQL stores the related business records, while MongoDB stores activity logs. I will demonstrate the database structures, queries and how an action in the frontend reaches both databases.”

| Component | Stores | Reason |
|---|---|---|
| MySQL | Customers, warehouses, routes, vehicles, drivers, assignments, shipments, packages, tracking events | Relationships, joins, constraints and atomic transactions |
| MongoDB | Activity logs in the `activity_logs` collection | Different actions can have different nested details |
| Next.js backend | Authentication, validation, SQL functions and logging | The browser accesses databases through APIs |
| React frontend | Forms, tables, charts and tracking screens | User interaction |

**Key distinction:** shipment tracking events are in **MySQL**. General activity/audit logs are in **MongoDB**. They are different records.

## 2. Before class: know where each command goes

Do not type prompt labels such as `mysql>` or `%`. They indicate where you are.

| You see | Where you are | What to paste |
|---|---|---|
| A Terminal prompt ending in `%` or `$` | macOS Terminal / VS Code Terminal | Commands labelled `bash` |
| `mysql>` | MySQL client | Commands labelled `sql` |
| `smart_logistics>` or a similar Mongo prompt | MongoDB shell (`mongosh`) | Mongo commands labelled `javascript`, plus `show dbs` / `use` / `show collections` |
| MongoDB Compass | Graphical MongoDB client | JSON filters in its Filter box |

Keep these windows ready:

1. Website: `http://localhost:3000/dashboard`.
2. Terminal tab connected to MySQL.
3. MongoDB Compass or a Terminal tab connected to `mongosh`.
4. VS Code with the corrected project open.

Do not display `.env.local` while presenting. It contains passwords. Show the connection code and `.env.example` instead.

## 3. Before class: start the application and prepare records

Your MySQL root login was repaired separately. Use that working password for MySQL; use `ADMIN_USERNAME` / `ADMIN_PASSWORD` for the website login.

From the corrected project folder in Terminal:

```bash
npm run db:migrate
npm run dev
```

Leave the development-server Terminal running. Open the dashboard and sign in.

MongoDB must also be running; the next section explains how to start and open it.

**If the databases have no demonstration data:** after both MySQL and MongoDB are available, you may run `npm run db:seed` from another project Terminal. This replaces existing SQL demonstration records and Mongo activity logs. Use it only when you intend to replace the current data. Do not run `db:reset` during the presentation.

A fresh successful seed creates 9 SQL tables, 40 shipments, 100 packages and 169 tracking events, plus 30 Mongo activity logs. Counts change after creating additional records. A migration alone creates structure, not demo data.

## 4. Open MongoDB / NoSQL on your Mac

### A. Start the database server

MongoDB Server (`mongod`), MongoDB Shell (`mongosh`) and Compass are different programs. Installing Compass alone does not start a database.

At preparation time, check in Terminal:

```bash
command -v mongosh
brew services list
```

If MongoDB is already installed, start the installed service shown by Homebrew. Do not install another version alongside an existing data directory just for this demo.

**For a fresh installation using Homebrew**, these commands install and start MongoDB 8.0:

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0
```

The server installation includes `mongosh`. If only the shell is missing:

```bash
brew install mongosh
```

These commands follow the [official MongoDB Homebrew instructions](https://github.com/mongodb/homebrew-brew). Do this preparation before class; installation may take time.

**Alternative if you already use Docker Desktop:** start Docker Desktop, then run only the MongoDB service from the project folder:

```bash
docker compose up -d mongodb
```

Your existing native MySQL installation can keep serving port 3306. Choose one MongoDB server method, not both on port 27017.

### B. Open MongoDB in Terminal

Run at the macOS Terminal prompt:

```bash
mongosh "mongodb://127.0.0.1:27017/smart_logistics"
```

If using the project's Docker service and `mongosh` is not installed on the Mac, run from the project folder:

```bash
docker compose exec mongodb mongosh smart_logistics
```

Inside `mongosh`, test the connection:

```javascript
db.runCommand({ ping: 1 })
```

Expected: a result containing `ok: 1`.

Use the same database name and connection as the application's `MONGODB_URI`. This guide assumes the default `smart_logistics`. An Atlas or authenticated installation requires its own connection URI.

### C. Open MongoDB visually in Compass — useful for the teacher

1. Install MongoDB Compass from the [official Compass download page](https://www.mongodb.com/try/download/compass) if needed.
2. Open Compass using Spotlight: **Command + Space**, type **MongoDB Compass**, press Enter.
3. Choose **Add New Connection**.
4. Enter `mongodb://127.0.0.1:27017` and connect.
5. Open database **smart_logistics**.
6. Open collection **activity_logs**.
7. Use the **Documents** tab; expand a document's `details` object.
8. Use the **Indexes** tab to show its indexes.

These steps use Compass's [connection-string workflow](https://www.mongodb.com/docs/compass/connect/).

If the database/collection is absent, create a record through the website while MongoDB is running, then refresh. Selecting a database name in the shell does not populate it.

## 5. Show MySQL — structure and actual records

### Demo 1: connect and select the database

**Terminal command:**

```bash
/usr/local/mysql/bin/mysql -h 127.0.0.1 -P 3306 -u root -p
```

Enter your MySQL password privately. At `mysql>`, run:

```sql
SELECT VERSION();
SHOW DATABASES;
USE smart_logistics;
SELECT DATABASE();
SHOW FULL TABLES;
```

**Say:** “This is the project's relational database. There are nine base tables and one view, `v_shipment_overview`.”

| Table | Explain it as |
|---|---|
| `customer` | Who books shipments |
| `warehouse` | Origin/destination hubs |
| `route` | A directed connection between two hubs |
| `vehicle` | Fleet details and status |
| `driver` | Driver details |
| `driver_vehicle` | Many-to-many driver–vehicle associations |
| `shipment` | Main booking record |
| `package` | Individual packages inside a shipment |
| `tracking_event` | Shipment status/location history |

### Demo 2: show columns, keys and constraints

```sql
DESCRIBE shipment;
DESCRIBE package;
SHOW CREATE TABLE shipment\G
SHOW CREATE TABLE driver_vehicle\G
```

`\G` displays a long result vertically. It replaces the semicolon on those statements.

**Point out:**

- `shipment_id`: primary key, generated using auto-increment.
- `tracking_id`: unique external tracking identifier.
- `customer_id` / `route_id`: foreign keys.
- `expected_delivery`: checked against booking date.
- `driver_vehicle`: composite primary key `(driver_id, vehicle_id)`.

**Say:** “A customer can have many shipments. Each shipment can have many packages and tracking events. The junction table represents a many-to-many relationship between drivers and vehicles.”

### Demo 3: show stored data

```sql
SELECT customer_id, name, email FROM customer LIMIT 5;

SELECT warehouse_id, name, location, capacity FROM warehouse;

SELECT shipment_id, tracking_id, customer_id, route_id,
       current_status, expected_delivery
FROM shipment
ORDER BY shipment_id DESC
LIMIT 5;

SELECT package_id, shipment_id, weight, fragile, dimensions
FROM package
ORDER BY package_id DESC
LIMIT 5;
```

**Say:** “A shipment is a booking. A package is one physical item inside that booking. Keeping them in separate tables allows a shipment to contain several packages.”

### Demo 4: demonstrate a JOIN

```sql
SELECT s.tracking_id,
       c.name AS customer,
       origin.name AS origin,
       destination.name AS destination,
       v.vehicle_number,
       d.name AS driver,
       s.current_status
FROM shipment s
JOIN customer c ON c.customer_id = s.customer_id
JOIN warehouse origin ON origin.warehouse_id = s.origin_warehouse_id
JOIN warehouse destination
  ON destination.warehouse_id = s.destination_warehouse_id
LEFT JOIN vehicle v ON v.vehicle_id = s.vehicle_id
LEFT JOIN driver d ON d.driver_id = s.driver_id
ORDER BY s.shipment_id DESC
LIMIT 5;
```

**Say:** “The join converts stored IDs into meaningful customer, warehouse, vehicle and driver information. LEFT JOIN keeps shipments in the result even when a vehicle or driver is not assigned.”

### Demo 5: show the view and overdue shipments

```sql
SHOW CREATE VIEW v_shipment_overview\G

SELECT tracking_id, customer_name, current_status,
       current_location, expected_delivery, is_delayed
FROM v_shipment_overview
ORDER BY shipment_id DESC
LIMIT 5;

SELECT tracking_id, current_status, expected_delivery
FROM v_shipment_overview
WHERE is_delayed = 1
ORDER BY expected_delivery;
```

**Say:** “The view reuses a joined query and calculates whether a shipment is overdue. Delayed means its expected date is in the past and its status is neither delivered nor cancelled. Delay is a flag, not a separate shipment status.”

Pending shipments:

```sql
SELECT tracking_id, current_status, expected_delivery
FROM v_shipment_overview
WHERE current_status IN ('BOOKED', 'PICKED_UP');
```

A pending shipment may also be delayed. Empty results are valid if the current data has no matching shipments.

### Demo 6: aggregation and indexes

```sql
SELECT current_status, COUNT(*) AS shipment_count
FROM shipment
GROUP BY current_status
ORDER BY shipment_count DESC;

SHOW INDEX FROM shipment;
SHOW INDEX FROM tracking_event;
```

**Say:** “GROUP BY supplies counts for the dashboard. Indexes support common lookups such as customer shipments, tracking IDs and event histories. An index improves suitable reads, but also has storage and write-maintenance costs.”

### Demo 7: show the status trigger

```sql
SHOW TRIGGERS;
SHOW CREATE TRIGGER trg_tracking_event_after_insert\G
```

**Say:** “After a tracking event is inserted, this trigger copies its status into the shipment's current-status field. The API separately prevents new events after delivery or cancellation. The trigger itself does not check that business rule.”

Do not insert tracking events manually during this demonstration; use the frontend in section 7 to exercise both SQL logic and Mongo logging.

## 6. Show MongoDB — documents and queries

These commands go inside **mongosh**, not at `mysql>` or the normal Terminal prompt.

### Demo 1: databases and collections

```javascript
show dbs
use smart_logistics
show collections
db.activity_logs.countDocuments({})
```

**Say:** “MongoDB organizes data as collections of documents. This project's collection is `activity_logs`. Documents are stored as BSON and displayed in JSON-like form.”

### Demo 2: inspect recent documents

```javascript
db.activity_logs.find({}).sort({ createdAt: -1 }).limit(5).pretty()
```

Explain the fields in an actual returned document:

| Field | Meaning |
|---|---|
| `_id` | MongoDB document identifier |
| `action` | Operation, such as `SHIPMENT_CREATED` |
| `entity` | Resource type, such as `shipment` |
| `entityId` | Application record identifier |
| `trackingId` | Shipment tracking ID, when applicable |
| `details` | Nested action-specific information |
| `createdAt` | Log timestamp |

**Say:** “Mongoose defines an application schema, so this is not completely unstructured data. The nested details can vary between activity types.”

### Demo 3: filter and project fields

```javascript
db.activity_logs.find(
  { action: "SHIPMENT_CREATED" },
  { _id: 0, trackingId: 1, action: 1, details: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(5).pretty()
```

**Say:** “The first object filters documents. The second selects fields to display. Sorting descending shows the newest events first.”

In Compass, paste this into the **Filter** box, then click **Find**:

```json
{ "action": "SHIPMENT_CREATED" }
```

### Demo 4: aggregation and indexes

```javascript
db.activity_logs.aggregate([
  { $group: { _id: "$action", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
])

db.activity_logs.getIndexes()
```

**Say:** “This aggregation counts documents by activity type. It is comparable to SQL GROUP BY. The project defines indexes for fields such as action, entity, tracking ID and creation time.”

## 7. Best live demonstration: one frontend action → both databases

This connects the UI to the database evidence. Use a new shipment so its IDs are known.

### A. Create a shipment in the website

1. Open `/shipments/new` through the UI.
2. Select an existing customer and route.
3. Choose an expected-delivery date tomorrow or later.
4. Add two packages, for example `2.50 kg / 40x30x20` and `1.00 kg / 20x15x10`.
5. Click **Create Shipment**.
6. Copy the generated tracking ID.

Replace `PASTE_TRACKING_ID_HERE` in the following commands with that exact ID. Do not assume the generated ID ends in `000041`.

### B. Prove the MySQL records were created

**At `mysql>`:**

```sql
SET @demo_tracking = 'PASTE_TRACKING_ID_HERE';

SELECT shipment_id, tracking_id, current_status, customer_id, route_id
FROM shipment
WHERE tracking_id = @demo_tracking;

SET @demo_id = (
  SELECT shipment_id FROM shipment WHERE tracking_id = @demo_tracking
);

SELECT package_id, weight, fragile, dimensions
FROM package
WHERE shipment_id = @demo_id;

SELECT status, location, event_timestamp
FROM tracking_event
WHERE shipment_id = @demo_id
ORDER BY event_timestamp, event_id;
```

Expected: one shipment, two packages, and an initial BOOKED event. The `@demo_id` variable exists only in this MySQL session; rerun its assignment if reconnecting.

### C. Prove the MongoDB log was created

**Inside mongosh:**

```javascript
var demoTracking = "PASTE_TRACKING_ID_HERE";

db.activity_logs.find({ trackingId: demoTracking })
  .sort({ createdAt: -1 }).pretty()
```

Expected: a `SHIPMENT_CREATED` document. Its `details.packages_count` should be 2.

Or use this Compass filter, substituting the tracking ID:

```json
{ "trackingId": "PASTE_TRACKING_ID_HERE" }
```

**Say:** “The same tracking ID connects the operational SQL record to the NoSQL activity record. This is an application-level association, not a database-enforced cross-database foreign key.”

### D. Add an event through the UI

1. Open that shipment's detail page.
2. Click **Add Event**.
3. Select **IN_TRANSIT** and enter a location.
4. Save.

Rerun in MySQL:

```sql
SELECT current_status FROM shipment WHERE shipment_id = @demo_id;

SELECT status, location, event_timestamp
FROM tracking_event
WHERE shipment_id = @demo_id
ORDER BY event_timestamp, event_id;
```

Rerun the Mongo filter from step C or refresh Compass.

**Say:** “The frontend called the API. SQL received a tracking event, the trigger updated current status, and the API also attempted a Mongo activity log.”

If the SQL operation succeeds but the Mongo log is absent, check MongoDB and `MONGODB_URI`. Logging failures are caught; they do not roll back an already committed SQL transaction.

## 8. Locate the files that connect frontend and databases

The frontend does **not** connect directly to MySQL or MongoDB. This is the path to show:

```text
Shipment form
    ↓ HTTP POST /api/shipments
Next.js route handler: authentication + validation
    ↓ createShipment()
SQL query function → MySQL connection pool → MySQL
    ↓ after SQL success
safeLogActivity() → Mongo connection + Mongoose model → MongoDB
    ↓ JSON response
Frontend success screen + cache refresh
```

Open your own corrected project in VS Code. Press **Command + P** and paste the file label below to find it. Links point to the verified corrected source copy on this Mac; your extracted folder may have a different location. Line numbers are for that reviewed copy and may shift after edits.

| File — use Command + P in VS Code | Purpose |
|---|---|
| [app/(admin)/shipments/new/page.tsx](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/app/(admin)/shipments/new/page.tsx:47>) — line 47 | Frontend booking form sends POST /api/shipments |
| [lib/client-api.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/client-api.ts:3>) — line 3 | Browser-side fetch helper; checks API errors |
| [app/api/shipments/route.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/app/api/shipments/route.ts:40>) — line 40 | Backend POST handler joins frontend, validation, SQL and logging |
| [lib/validators/shipment.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/validators/shipment.ts>) | Zod shipment and package validation |
| [lib/queries/shipmentQueries.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/queries/shipmentQueries.ts:207>) — line 207 | createShipment: parameterized SQL and transaction |
| [lib/db/mysql.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/db/mysql.ts:15>) — line 15 | mysql.createPool: actual SQL connection |
| [lib/api.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/api.ts:86>) — line 86 | safeLogActivity: writes the Mongo activity document |
| [lib/db/mongo.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/db/mongo.ts:25>) — line 25 | connectMongo: actual MongoDB connection |
| [lib/models/ActivityLog.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/models/ActivityLog.ts>) | Mongoose schema, indexes and activity_logs collection |
| [app/api/activity-logs/route.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/app/api/activity-logs/route.ts>) | API for reading Mongo activity logs |
| [app/api/dashboard/stats/route.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/app/api/dashboard/stats/route.ts>) | Dashboard API entry point |
| [lib/queries/shipmentQueries.ts](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/lib/queries/shipmentQueries.ts:431>) — line 431 | getDashboardStats: reads SQL summaries and Mongo logs |
| [app/(admin)/dashboard/page.tsx](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/app/(admin)/dashboard/page.tsx:33>) — line 33 | Frontend dashboard requests statistics and displays logs |
| [db/mysql/01_schema.sql](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/db/mysql/01_schema.sql>) | SQL table definitions, keys and constraints |
| [db/mysql/02_views_triggers.sql](</Users/vinayakajagadish/Documents/Codex/2026-10-30/ch/work/DBMS-mini-project-main/db/mysql/02_views_triggers.sql>) | SQL view and trigger definitions |


### What to say while showing those files

1. **Shipment form:** “Here `apiFetch` sends the form data as JSON to `/api/shipments`.”
2. **Client API helper:** “It checks the response and throws an error for failed requests.”
3. **Shipment API handler:** “POST checks admin access, parses the request using Zod, calls `createShipment`, then calls `safeLogActivity`.”
4. **Shipment query function:** “This is the SQL transaction. It checks referenced records, inserts the shipment and packages, inserts the first event, then commits. A failure rolls back.”
5. **MySQL connector:** “`mysql.createPool` reads connection settings from environment variables. The server uses this pool, not the browser.”
6. **Mongo connector:** “`mongoose.connect` reads `MONGODB_URI` and reuses a cached connection.”
7. **ActivityLog model:** “This schema describes the log fields and explicitly selects collection `activity_logs`.”
8. **Logging helper:** “`ActivityLog.create` writes the document. Its try/catch makes logging nonfatal to the main request.”

The dashboard demonstrates reading both databases: its API calls `getDashboardStats`, which performs SQL aggregations and reads recent activity documents from MongoDB.

## 9. Optional: demonstrate ROLLBACK without keeping a change

Use the `@demo_id` from section 7. Run this only after the shipment exists. Keep all statements in the same MySQL tab and run through ROLLBACK.

```sql
SET @demo_customer_id = (
  SELECT customer_id FROM shipment WHERE shipment_id = @demo_id
);

SELECT name FROM customer WHERE customer_id = @demo_customer_id;
START TRANSACTION;
UPDATE customer SET name = 'Temporary transaction demo'
WHERE customer_id = @demo_customer_id;
SELECT name FROM customer WHERE customer_id = @demo_customer_id;
ROLLBACK;
SELECT name FROM customer WHERE customer_id = @demo_customer_id;
```

**Say:** “The update is visible inside my transaction. ROLLBACK restores the original value. Shipment booking uses a transaction so it cannot leave a partially created booking.”

This direct SQL demonstration does not create a Mongo log because it does not pass through the application's API.

## 10. Likely teacher questions and short answers

**Why two databases?**  
“MySQL fits structured records with relationships and transactions. MongoDB fits activity documents whose nested details differ by operation. This is a design choice; it is also possible to store logs in SQL.”

**What is the transaction boundary?**  
“Shipment, packages and the first tracking event are atomic within MySQL. Mongo logging happens separately; there is no distributed transaction across both databases.”

**How do you prevent SQL injection?**  
“Query functions use parameterized values with `?` placeholders instead of inserting user input into SQL strings.”

**How do you handle simultaneous tracking updates?**  
“The API locks the shipment row with SELECT FOR UPDATE, checks terminal status and inserts the event in the same transaction.”

**What is a view?**  
“A stored query that can be selected like a table. Our view combines shipment-related tables and calculates the delayed flag.”

**What is a trigger?**  
“Database logic automatically executed for a database event. Our AFTER INSERT trigger updates shipment status after a tracking event.”

**Is the design completely in 3NF?**  
“The main entities are separated to reduce duplication, but shipment endpoints and current status introduce intentional redundancy. The route-edit rule and trigger maintain consistency. I would not claim every table is strictly in 3NF.”

**Is this live GPS tracking?**  
“No. It shows status and location events entered through the application. GPS integration is future work.”

**What if MongoDB stops?**  
“SQL operations can still succeed. Activity writes are best effort, so a log may be missing. A durable queue would improve this.”

## 11. Troubleshooting before the presentation

| Symptom | Check |
|---|---|
| Website connection refused | Start `npm run dev` and keep that Terminal open; use its printed port |
| Admin access not configured | Set admin credentials in `.env.local`, then restart Next.js |
| MySQL Access denied | Use the working MySQL password in `MYSQL_PASSWORD`; it is separate from the website login |
| Unknown database or missing tables | Confirm `MYSQL_DATABASE`, then run `npm run db:migrate` |
| `mongosh: command not found` | Install the shell or use the Docker command in section 4 |
| Mongo connection refused | Start the Mongo server and verify host/port; Compass alone is not a server |
| Mongo collection missing | Check the URI/database, create a customer or shipment through the app, and refresh |
| SQL succeeds but no Mongo log | Check Mongo connectivity and server log messages; logging is best effort |
| No matching tracking ID | Copy the actual ID from the newly created shipment; check that app and shell use the same database |

**Short presentation route if time is limited:** opening explanation → SHOW FULL TABLES → DESCRIBE shipment → JOIN query → SHOW TRIGGERS → Mongo document → create one shipment → show matching records in both databases → open the API handler and two connection files.
