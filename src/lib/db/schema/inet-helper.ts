import { customType } from "drizzle-orm/pg-core";

// INET maps to a string (e.g. "192.168.1.1")
export const inet = customType<{ data: string; driverData: string }>({
  dataType() {
    return "inet";
  },
});
