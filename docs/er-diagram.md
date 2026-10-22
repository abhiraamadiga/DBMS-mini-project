# Smart Logistics Management System — ER & Relational Schema

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ SHIPMENT : places
    ROUTE ||--o{ SHIPMENT : "followed by"
    WAREHOUSE ||--o{ SHIPMENT : "ships from"
    WAREHOUSE ||--o{ SHIPMENT : "ships to"
    WAREHOUSE ||--o{ ROUTE : "starts at"
    WAREHOUSE ||--o{ ROUTE : "ends at"
    SHIPMENT ||--|{ PACKAGE : contains
    SHIPMENT ||--o{ TRACKING_EVENT : generates
    VEHICLE |o--o{ SHIPMENT : "used by"
    DRIVER |o--o{ SHIPMENT : "assigned to"
    DRIVER }o--o{ VEHICLE : drives

    CUSTOMER {
        int customer_id PK
        string name
        string email
        string phone
        string address
    }
    SHIPMENT {
        int shipment_id PK
        string tracking_id
        datetime booking_date
        date expected_delivery
        string current_status
    }
    PACKAGE {
        int package_id PK
        decimal weight
        boolean fragile
        string dimensions
    }
    WAREHOUSE {
        int warehouse_id PK
        string name
        string location
        int capacity
    }
    ROUTE {
        int route_id PK
        decimal distance_km
        decimal est_time_hrs
    }
    VEHICLE {
        int vehicle_id PK
        string vehicle_number
        string type
        string status
    }
    DRIVER {
        int driver_id PK
        string name
        string phone
        string license_number
    }
    TRACKING_EVENT {
        bigint event_id PK
        datetime event_timestamp
        string location
        string status
    }
```

---

## 2. ER to Relational Schema Mapping Rules

| Rule applied | Result |
|---|---|
| Strong entity becomes a table | `customer`, `shipment`, `package`, `warehouse`, `route`, `vehicle`, `driver`, `tracking_event` |
| 1:N puts FK on the "many" side | `shipment.customer_id`, `package.shipment_id`, `tracking_event.shipment_id`, `shipment.route_id` |
| Two relationships to the same entity use two FKs | `shipment.origin_warehouse_id` / `destination_warehouse_id`; `route.origin_warehouse_id` / `destination_warehouse_id` |
| Optional N:1 uses a nullable FK | `shipment.vehicle_id`, `shipment.driver_id` |
| M:N becomes a junction table | `driver_vehicle (driver_id, vehicle_id)` for DRIVES |

---

## 3. Relational Schema (3NF)

```text
customer(customer_id PK, name, email UNIQUE, phone, address, created_at)

warehouse(warehouse_id PK, name, location, capacity)

route(route_id PK, origin_warehouse_id FK, destination_warehouse_id FK, distance_km, est_time_hrs)

vehicle(vehicle_id PK, vehicle_number UNIQUE, type, status)

driver(driver_id PK, name, phone, license_number UNIQUE)

driver_vehicle(driver_id FK, vehicle_id FK, assigned_on)
  PRIMARY KEY (driver_id, vehicle_id)

shipment(shipment_id PK, tracking_id UNIQUE, customer_id FK, route_id FK,
         origin_warehouse_id FK, destination_warehouse_id FK,
         vehicle_id FK NULL, driver_id FK NULL,
         booking_date, expected_delivery, current_status)

package(package_id PK, shipment_id FK, weight, fragile, dimensions)

tracking_event(event_id PK, shipment_id FK, status, location, event_timestamp)
```

All relations are normalized to **Third Normal Form (3NF)**:
1. **1NF**: Atomic attributes, primary keys defined for every table.
2. **2NF**: No partial functional dependencies (all non-key attributes depend on whole composite PKs, e.g., in `driver_vehicle`).
3. **3NF**: No transitive dependencies ($X \to Y$ where $Y$ is not part of a candidate key). `current_status` on `shipment` is a deliberate trigger-maintained denormalization for fast O(1) reads without recalculating from `tracking_event` history.
