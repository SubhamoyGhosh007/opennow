import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db";

const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
export { client as pgClient };
