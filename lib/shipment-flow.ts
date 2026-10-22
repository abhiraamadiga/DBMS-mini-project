export const SHIPMENT_FLOW: Record<string, string[]> = {
  BOOKED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["AT_WAREHOUSE", "OUT_FOR_DELIVERY"],
  AT_WAREHOUSE: ["IN_TRANSIT", "OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function getAllowedTransitions(currentStatus: string, role: string): string[] {
  const allAllowed = SHIPMENT_FLOW[currentStatus] || [];
  if (role === "ADMIN") {
    // Admin can also cancel from any non-terminal status
    if (!["DELIVERED", "CANCELLED"].includes(currentStatus) && !allAllowed.includes("CANCELLED")) {
      return [...allAllowed, "CANCELLED"];
    }
    return allAllowed;
  }
  if (role === "DELIVERY_PARTNER") {
    // Partner can only do physical delivery transitions (cannot cancel)
    return allAllowed.filter((s) => s !== "CANCELLED");
  }
  if (role === "CUSTOMER") {
    // Customer can only cancel from BOOKED
    if (currentStatus === "BOOKED") return ["CANCELLED"];
    return [];
  }
  return [];
}

export function validateTransition(
  currentStatus: string,
  nextStatus: string,
  role: string,
  hasVehicleAndDriver: boolean
): { valid: boolean; reason?: string; allowed: string[] } {
  const allowed = getAllowedTransitions(currentStatus, role);

  if (["DELIVERED", "CANCELLED"].includes(currentStatus)) {
    return {
      valid: false,
      reason: `Shipment is in terminal status '${currentStatus}'. No further updates allowed.`,
      allowed: [],
    };
  }

  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from '${currentStatus}' to '${nextStatus}'. Allowed next steps: ${allowed.join(", ") || "none"}.`,
      allowed,
    };
  }

  if (nextStatus === "PICKED_UP" && !hasVehicleAndDriver) {
    return {
      valid: false,
      reason: "Shipment cannot be moved to 'PICKED_UP' until both a vehicle and a driver are assigned.",
      allowed,
    };
  }

  return { valid: true, allowed };
}
