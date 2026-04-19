import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getLegacyPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:     process.env.LEGACY_DB_HOST     || "localhost",
      port:     parseInt(process.env.LEGACY_DB_PORT || "3306"),
      user:     process.env.LEGACY_DB_USER     || "",
      password: process.env.LEGACY_DB_PASS     || "",
      database: process.env.LEGACY_DB_NAME     || "",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function legacyQuery<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const db = getLegacyPool();
  const [rows] = await db.execute(sql, values);
  return rows as T[];
}
