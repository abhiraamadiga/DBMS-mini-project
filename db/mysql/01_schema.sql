CREATE DATABASE IF NOT EXISTS smart_logistics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE smart_logistics;

CREATE TABLE customer (
  customer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  phone       VARCHAR(20)  NOT NULL,
  address     VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE warehouse (
  warehouse_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  location     VARCHAR(120) NOT NULL,
  capacity     INT UNSIGNED NOT NULL,
  CONSTRAINT chk_warehouse_capacity CHECK (capacity > 0)
) ENGINE=InnoDB;

CREATE TABLE route (
  route_id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  origin_warehouse_id      INT UNSIGNED NOT NULL,
  destination_warehouse_id INT UNSIGNED NOT NULL,
  distance_km              DECIMAL(8,2) NOT NULL,
  est_time_hrs             DECIMAL(5,2) NOT NULL,
  CONSTRAINT fk_route_origin FOREIGN KEY (origin_warehouse_id)
    REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
  CONSTRAINT fk_route_destination FOREIGN KEY (destination_warehouse_id)
    REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
  CONSTRAINT chk_route_endpoints CHECK (origin_warehouse_id <> destination_warehouse_id),
  CONSTRAINT chk_route_values CHECK (distance_km > 0 AND est_time_hrs > 0),
  UNIQUE KEY uq_route_pair (origin_warehouse_id, destination_warehouse_id)
) ENGINE=InnoDB;

CREATE TABLE vehicle (
  vehicle_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(20) NOT NULL UNIQUE,
  type           ENUM('BIKE','VAN','TRUCK','CONTAINER') NOT NULL,
  status         ENUM('AVAILABLE','ON_TRIP','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE'
) ENGINE=InnoDB;

CREATE TABLE driver (
  driver_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  license_number VARCHAR(30)  NOT NULL UNIQUE
) ENGINE=InnoDB;

-- DRIVES (M:N)
CREATE TABLE driver_vehicle (
  driver_id   INT UNSIGNED NOT NULL,
  vehicle_id  INT UNSIGNED NOT NULL,
  assigned_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (driver_id, vehicle_id),
  CONSTRAINT fk_dv_driver  FOREIGN KEY (driver_id)  REFERENCES driver(driver_id)   ON DELETE CASCADE,
  CONSTRAINT fk_dv_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipment (
  shipment_id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tracking_id              VARCHAR(16) NOT NULL UNIQUE,          -- e.g. SLM2026000123
  customer_id              INT UNSIGNED NOT NULL,                -- PLACES
  route_id                 INT UNSIGNED NOT NULL,                -- FOLLOWS
  origin_warehouse_id      INT UNSIGNED NOT NULL,                -- SHIPS FROM
  destination_warehouse_id INT UNSIGNED NOT NULL,                -- SHIPS TO
  vehicle_id               INT UNSIGNED NULL,                    -- USES
  driver_id                INT UNSIGNED NULL,                    -- ASSIGNED TO
  booking_date             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery        DATE NOT NULL,
  current_status           ENUM('BOOKED','PICKED_UP','IN_TRANSIT','AT_WAREHOUSE',
                                'OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
                           NOT NULL DEFAULT 'BOOKED',
  CONSTRAINT fk_ship_customer    FOREIGN KEY (customer_id)              REFERENCES customer(customer_id)   ON DELETE RESTRICT,
  CONSTRAINT fk_ship_route       FOREIGN KEY (route_id)                 REFERENCES route(route_id)         ON DELETE RESTRICT,
  CONSTRAINT fk_ship_origin      FOREIGN KEY (origin_warehouse_id)      REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ship_destination FOREIGN KEY (destination_warehouse_id) REFERENCES warehouse(warehouse_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ship_vehicle     FOREIGN KEY (vehicle_id)               REFERENCES vehicle(vehicle_id)     ON DELETE SET NULL,
  CONSTRAINT fk_ship_driver      FOREIGN KEY (driver_id)                REFERENCES driver(driver_id)       ON DELETE SET NULL,
  CONSTRAINT chk_ship_dates CHECK (expected_delivery >= DATE(booking_date)),
  INDEX idx_ship_customer (customer_id),
  INDEX idx_ship_route    (route_id),
  INDEX idx_ship_vehicle  (vehicle_id),
  INDEX idx_ship_driver   (driver_id),
  INDEX idx_ship_status_expected (current_status, expected_delivery)
) ENGINE=InnoDB;

CREATE TABLE package (
  package_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id INT UNSIGNED NOT NULL,
  weight      DECIMAL(8,2) NOT NULL,                -- kg
  fragile     BOOLEAN NOT NULL DEFAULT FALSE,
  dimensions  VARCHAR(30) NOT NULL,                 -- 'LxWxH' in cm, e.g. 40x30x20
  CONSTRAINT fk_pkg_shipment FOREIGN KEY (shipment_id) REFERENCES shipment(shipment_id) ON DELETE CASCADE,
  CONSTRAINT chk_pkg_weight CHECK (weight > 0)
) ENGINE=InnoDB;

CREATE TABLE tracking_event (
  event_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shipment_id     INT UNSIGNED NOT NULL,
  status          ENUM('BOOKED','PICKED_UP','IN_TRANSIT','AT_WAREHOUSE',
                       'OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL,
  location        VARCHAR(120) NOT NULL,
  event_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_shipment FOREIGN KEY (shipment_id) REFERENCES shipment(shipment_id) ON DELETE CASCADE,
  INDEX idx_event_shipment_time (shipment_id, event_timestamp)
) ENGINE=InnoDB;

CREATE TABLE app_user (
  user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,                       -- bcrypt hash only, never plaintext
  role          ENUM('ADMIN','DELIVERY_PARTNER','CUSTOMER') NOT NULL,
  customer_id   INT UNSIGNED NULL UNIQUE,
  driver_id     INT UNSIGNED NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_driver   FOREIGN KEY (driver_id)   REFERENCES driver(driver_id)     ON DELETE CASCADE,
  INDEX idx_user_role (role)
) ENGINE=InnoDB;

