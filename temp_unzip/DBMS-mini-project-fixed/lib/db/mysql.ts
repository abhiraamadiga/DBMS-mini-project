import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const globalForMySQL = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

export const pool =
  globalForMySQL.mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD ?? "changeme",
    database: process.env.MYSQL_DATABASE || "smart_logistics",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    namedPlaceholders: false,
    decimalNumbers: true,
    dateStrings: ["DATE"],
    timezone: "+00:00",
  });

if (!globalForMySQL.mysqlPool) {
  pool.on("connection", connection => { connection.query("SET time_zone = '+00:00'"); });
}

if (process.env.NODE_ENV !== "production") {
  globalForMySQL.mysqlPool = pool;
}

export default pool;
