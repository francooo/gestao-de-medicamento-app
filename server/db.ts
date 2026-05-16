import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL or NEON_DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });
