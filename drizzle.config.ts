import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema/*.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db",
  },
} satisfies Config;
