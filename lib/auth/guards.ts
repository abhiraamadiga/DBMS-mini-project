import { getSession, SessionUser, Role } from "./session";
import { pool } from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";
import { headers } from "next/headers";

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

interface AppUserDbRow extends RowDataPacket {
  user_id: number;
  email: string;
  role: Role;
  customer_id: number | null;
  driver_id: number | null;
  is_active: number;
  linked_name?: string;
}

export async function requireAuth(allowedRoles?: Role[]): Promise<SessionUser> {
  let preferredRole: Role | undefined;

  try {
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    if (allowedRoles && allowedRoles.length === 1) {
      preferredRole = allowedRoles[0];
    } else if (referer.includes("/admin")) {
      preferredRole = "ADMIN";
    } else if (referer.includes("/partner")) {
      preferredRole = "DELIVERY_PARTNER";
    } else if (referer.includes("/customer")) {
      preferredRole = "CUSTOMER";
    }
  } catch {}

  let session = await getSession(preferredRole);

  // If session doesn't match allowedRoles, check other role cookies
  if ((!session || (allowedRoles && !allowedRoles.includes(session.role))) && allowedRoles) {
    for (const role of allowedRoles) {
      const candidate = await getSession(role);
      if (candidate && candidate.role === role) {
        session = candidate;
        break;
      }
    }
  }

  if (!session) {
    throw new AuthError(401, "UNAUTHENTICATED", "Authentication required");
  }

  // Defense-in-depth: Re-check user row in MySQL so deactivation takes effect immediately
  const [rows] = await pool.query<AppUserDbRow[]>(
    `SELECT u.user_id, u.email, u.role, u.customer_id, u.driver_id, u.is_active,
            COALESCE(c.name, d.name, 'Admin') as linked_name
     FROM app_user u
     LEFT JOIN customer c ON c.customer_id = u.customer_id
     LEFT JOIN driver d ON d.driver_id = u.driver_id
     WHERE u.user_id = ?`,
    [session.userId]
  );

  const dbUser = rows[0];
  if (!dbUser || !dbUser.is_active) {
    throw new AuthError(401, "ACCOUNT_DISABLED", "Account disabled. Contact admin.");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(dbUser.role)) {
    throw new AuthError(403, "FORBIDDEN", "Forbidden: insufficient permissions");
  }

  return {
    userId: dbUser.user_id,
    email: dbUser.email,
    role: dbUser.role,
    name: dbUser.linked_name || session.name,
    customerId: dbUser.customer_id,
    driverId: dbUser.driver_id,
  };
}

export function shipmentScope(user: SessionUser): {
  customer_id?: number;
  driver_id?: number;
} {
  if (user.role === "ADMIN") {
    return {};
  }
  if (user.role === "CUSTOMER") {
    if (!user.customerId) {
      throw new AuthError(403, "NO_LINKED_CUSTOMER", "No customer linked to this account");
    }
    return { customer_id: user.customerId };
  }
  if (user.role === "DELIVERY_PARTNER") {
    if (!user.driverId) {
      throw new AuthError(403, "NO_LINKED_DRIVER", "No driver linked to this account");
    }
    return { driver_id: user.driverId };
  }
  return {};
}
