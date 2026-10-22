import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load .env.local first, then fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "changeme",
  multipleStatements: true,
};

export async function runMigrations() {
  console.log("Connecting to MySQL at %s:%d as %s...", dbConfig.host, dbConfig.port, dbConfig.user);

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL successfully.");

    // 1. Run schema DDL
    const schemaPath = path.resolve(process.cwd(), "db/mysql/01_schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    console.log("Executing 01_schema.sql...");
    await connection.query(schemaSql);
    console.log("Schema tables created successfully.");

    // Switch to database for views and triggers
    await connection.changeUser({ database: process.env.MYSQL_DATABASE || "smart_logistics" });

    // 2. Run views and triggers separated by '-- @@'
    const viewsTriggersPath = path.resolve(process.cwd(), "db/mysql/02_views_triggers.sql");
    const viewsTriggersSql = fs.readFileSync(viewsTriggersPath, "utf-8");
    const statements = viewsTriggersSql
      .split(/^-- @@$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} view/trigger statements...`);
    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log("Views and triggers created successfully.");

    // Verify created objects
    const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const [views] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    const [triggers] = await connection.query("SHOW TRIGGERS");

    console.log(`\nMigration completed successfully!`);
    console.log(`- Base tables: ${(tables as any[]).length}`);
    console.log(`- Views: ${(views as any[]).length}`);
    console.log(`- Triggers: ${(triggers as any[]).length}\n`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations();
}
