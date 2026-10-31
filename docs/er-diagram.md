# Smart Logistics Management System — Complete ER & Relational Schema

> **Document Version:** 2.0 (Post-Audit & Multi-Role Authentication Update)  
> **Prepared for:** DBMS Mini-Project Presentation & Viva

---

## 1. Entity-Relationship (ER) Diagram (Crow's Foot Notation)

```mermaid
erDiagram
    %% Core Entities & Relationships
    CUSTOMER ||--o{ SHIPMENT : "places (1:N)"
    ROUTE ||--o{ SHIPMENT : "followed by (1:N)"
    WAREHOUSE ||--o{ SHIPMENT : "ships from (origin)"
    WAREHOUSE ||--o{ SHIPMENT : "ships to (destination)"
    WAREHOUSE ||--o{ ROUTE : "originates (1:N)"
    WAREHOUSE ||--o{ ROUTE : "terminates (1:N)"
    SHIPMENT ||--|{ PACKAGE : "contains (1:N mandatory)"
    SHIPMENT ||--o{ TRACKING_EVENT : "generates (1:N)"
    VEHICLE |o--o{ SHIPMENT : "carries (0..1:N optional)"
    DRIVER |o--o{ SHIPMENT : "delivers (0..1:N optional)"
    DRIVER }o--o{ VEHICLE : "drives (M:N via driver_vehicle)"

    %% Multi-Role Authentication Links
    CUSTOMER |o--o| APP_USER : "has login account (0..1 : 1)"
    DRIVER |o--o| APP_USER : "has login account (0..1 : 1)"

    %% Hybrid NoSQL Document Collection
    APP_USER ||--o{ ACTIVITY_LOG : "triggers audit entry (MongoDB)"

    %% Entity Attributes & Keys
    APP_USER {
        int user_id PK "Auto Increment"
        string email UK "Unique login email"
        string password_hash "Bcrypt hash"
        enum role "ADMIN, DELIVERY_PARTNER, CUSTOMER"
        int customer_id FK "Nullable, Unique"
        int driver_id FK "Nullable, Unique"
        boolean is_active "Default true"
        datetime last_login_at
        datetime created_at
    }

    CUSTOMER {
        int customer_id PK "Auto Increment"
        string name "Full Name"
        string email UK "Unique Contact Email"
        string phone "Phone Number"
        string address "Billing/Shipping Address"
        datetime created_at
    }

    WAREHOUSE {
        int warehouse_id PK "Auto Increment"
        string name "Hub/Facility Name"
        string location "City / Street Address"
        int capacity "Max packages (>0)"
    }

    ROUTE {
        int route_id PK "Auto Increment"
        int origin_warehouse_id FK "Warehouse origin"
        int destination_warehouse_id FK "Warehouse destination"
        decimal distance_km "DECIMAL(8,2)"
        decimal est_time_hrs "DECIMAL(5,2)"
    }

    VEHICLE {
        int vehicle_id PK "Auto Increment"
        string vehicle_number UK "Registration Number"
        enum type "BIKE, VAN, TRUCK, CONTAINER"
        enum status "AVAILABLE, ON_TRIP, MAINTENANCE"
    }

    DRIVER {
        int driver_id PK "Auto Increment"
        string name "Driver Full Name"
        string phone "Phone Number"
        string license_number UK "Commercial Driving License"
    }

    SHIPMENT {
        int shipment_id PK "Auto Increment"
        string tracking_id UK "TRK-XXXX-XXXX"
        int customer_id FK "Customer who booked"
        int route_id FK "Assigned Route"
        int origin_warehouse_id FK "Origin Hub"
        int destination_warehouse_id FK "Destination Hub"
        int vehicle_id FK "Nullable until dispatch"
        int driver_id FK "Nullable until dispatch"
        datetime booking_date "Booking Timestamp"
        date expected_delivery "Estimated Arrival Date"
        enum current_status "BOOKED, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED"
    }

    PACKAGE {
        int package_id PK "Auto Increment"
        int shipment_id FK "Parent Shipment"
        decimal weight_kg "Weight in kilograms (>0)"
        decimal length_cm "Length (>0)"
        decimal width_cm "Width (>0)"
        decimal height_cm "Height (>0)"
        boolean is_fragile "Fragile Handling Flag"
        string description "Package description"
    }

    TRACKING_EVENT {
        bigint event_id PK "Auto Increment"
        int shipment_id FK "Parent Shipment"
        enum status "BOOKED, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED"
        string location "Checkpoint location string"
        datetime event_timestamp "Checkpoint event time"
    }

    ACTIVITY_LOG {
        string _id PK "MongoDB ObjectId"
        object actor "{ userId, role, name }"
        string action "BOOK_SHIPMENT, ASSIGN_DRIVER, UPDATE_STATUS, LOGIN"
        string entity "shipment, customer, driver, user"
        int entityId "Referenced entity primary key"
        object details "Polymorphic JSON metadata"
        datetime timestamp "Audit event timestamp"
    }
```

---

## 2. ER to Relational Schema Mapping Rules

| Rule applied | Result |
|---|---|
| Strong entity becomes a table | `customer`, `shipment`, `package`, `warehouse`, `route`, `vehicle`, `driver`, `tracking_event`, `app_user` |
| 1:N puts FK on the "many" side | `shipment.customer_id`, `package.shipment_id`, `tracking_event.shipment_id`, `shipment.route_id` |
| Two relationships to the same entity use two FKs | `shipment.origin_warehouse_id` / `destination_warehouse_id`; `route.origin_warehouse_id` / `destination_warehouse_id` |
| Optional N:1 uses a nullable FK | `shipment.vehicle_id`, `shipment.driver_id` (assigned on dispatch) |
| M:N becomes a junction table | `driver_vehicle (driver_id, vehicle_id, assigned_on)` for `DRIVES` |
| 1:1 optional login link | `app_user.customer_id` and `app_user.driver_id` nullable unique FKs |

---

## 3. Relational Schema (3NF)

```text
customer(customer_id PK, name, email UNIQUE, phone, address, created_at)

warehouse(warehouse_id PK, name, location, capacity)

route(route_id PK, origin_warehouse_id FK, destination_warehouse_id FK, distance_km, est_time_hrs)
      CONSTRAINT: origin_warehouse_id <> destination_warehouse_id
      UNIQUE KEY: (origin_warehouse_id, destination_warehouse_id)

vehicle(vehicle_id PK, vehicle_number UNIQUE, type, status)

driver(driver_id PK, name, phone, license_number UNIQUE)

driver_vehicle(driver_id FK, vehicle_id FK, assigned_on)
  PRIMARY KEY (driver_id, vehicle_id)

shipment(shipment_id PK, tracking_id UNIQUE, customer_id FK, route_id FK,
         origin_warehouse_id FK, destination_warehouse_id FK,
         vehicle_id FK NULL, driver_id FK NULL,
         booking_date, expected_delivery, current_status)

package(package_id PK, shipment_id FK, weight_kg, length_cm, width_cm, height_cm, is_fragile, description)

tracking_event(event_id PK, shipment_id FK, status, location, event_timestamp)

app_user(user_id PK, email UNIQUE, password_hash, role, customer_id FK NULL UNIQUE,
         driver_id FK NULL UNIQUE, is_active, last_login_at, created_at)
```

All relations are normalized to **Third Normal Form (3NF)**:
1. **1NF**: Atomic attributes (dimensions decomposed into length, width, height), primary keys defined for every table.
2. **2NF**: No partial functional dependencies (all non-key attributes depend on whole composite PKs, e.g., in `driver_vehicle`).
3. **3NF**: No transitive functional dependencies ($X \to Y$ where $Y \to Z$ does not exist for non-prime attributes). `current_status` on `shipment` is a deliberate trigger-maintained denormalization for fast O(1) reads without recalculating from `tracking_event` history.
