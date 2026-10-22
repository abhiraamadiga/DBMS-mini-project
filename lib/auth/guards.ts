import { getSession, SessionUser, Role } from "./session";
import { pool } from "@/lib/db/mysql";
import { RowDataPacket } from "mysql2";

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
  const session = await getSession();
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

export function shipmentScope(session: SessionUser): { customerId?: number; driverId?: number } {
  if (session.role === "CUSTOMER" && session.customerId) {
    return { customerId: session.customerId };
  }
  if (session.role === "DELIVERY_PARTNER" && session.driverId) {
    return { driverId: session.driverId };
  }
  return {};
}
