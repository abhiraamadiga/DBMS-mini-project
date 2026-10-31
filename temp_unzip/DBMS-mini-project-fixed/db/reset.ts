import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { runMigrations } from "./migrate";
import { seed } from "./seed/seed";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function reset() {
  console.log("=== RESETTING DATABASE ===");
  const host = process.env.MYSQL_HOST || "localhost";
  const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD ?? "changeme";
  const database = process.env.MYSQL_DATABASE || "smart_logistics";

  console.log(`Dropping and recreating database '${database}'...`);
  const conn = await mysql.createConnection({ host, port, user, password });
  try {
    await conn.query(`DROP DATABASE IF EXISTS ${mysql.escapeId(database)};`);
    await conn.query(
      `CREATE DATABASE ${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`
    );
    console.log(`Database '${database}' recreated.`);
  } finally {
    await conn.end();
  }

  console.log("\nRunning migrations...");
  await runMigrations();

  console.log("\nRunning seed script...");
  await seed();

  console.log("\n=== RESET COMPLETE ===");
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
