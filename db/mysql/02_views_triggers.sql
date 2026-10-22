-- Keeps shipment.current_status in sync with the latest tracking event
CREATE TRIGGER trg_tracking_event_after_insert
AFTER INSERT ON tracking_event
FOR EACH ROW
  UPDATE shipment SET current_status = NEW.status WHERE shipment_id = NEW.shipment_id;

-- @@

CREATE OR REPLACE VIEW v_shipment_overview AS
SELECT
  s.shipment_id, s.tracking_id, s.booking_date, s.expected_delivery, s.current_status,
  c.customer_id, c.name AS customer_name,
  wo.warehouse_id AS origin_id,      wo.name AS origin_name,      wo.location AS origin_location,
  wd.warehouse_id AS destination_id, wd.name AS destination_name, wd.location AS destination_location,
  s.route_id, s.vehicle_id, v.vehicle_number,
  s.driver_id, d.name AS driver_name,
  (SELECT te.location FROM tracking_event te
     WHERE te.shipment_id = s.shipment_id
     ORDER BY te.event_timestamp DESC, te.event_id DESC LIMIT 1) AS current_location,
  (s.expected_delivery < CURDATE()
     AND s.current_status NOT IN ('DELIVERED','CANCELLED')) AS is_delayed
FROM shipment s
JOIN customer  c  ON c.customer_id   = s.customer_id
JOIN warehouse wo ON wo.warehouse_id = s.origin_warehouse_id
JOIN warehouse wd ON wd.warehouse_id = s.destination_warehouse_id
LEFT JOIN vehicle v ON v.vehicle_id  = s.vehicle_id
LEFT JOIN driver  d ON d.driver_id   = s.driver_id;

-- @@

CREATE TRIGGER trg_app_user_role_bi
BEFORE INSERT ON app_user
FOR EACH ROW
BEGIN
  IF NEW.role = 'CUSTOMER' AND (NEW.customer_id IS NULL OR NEW.driver_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CUSTOMER user must link to exactly one customer';
  ELSEIF NEW.role = 'DELIVERY_PARTNER' AND (NEW.driver_id IS NULL OR NEW.customer_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELIVERY_PARTNER user must link to exactly one driver';
  ELSEIF NEW.role = 'ADMIN' AND (NEW.customer_id IS NOT NULL OR NEW.driver_id IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ADMIN user must not link to a customer or driver';
  END IF;
END;

