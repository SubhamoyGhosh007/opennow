import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const scCatItem = pgTable("sc_cat_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  shortDescription: varchar("short_description", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull().default("Hardware"),
  icon: varchar("icon", { length: 50 }).default("Package"),
  variables: jsonb("variables").default([]),
  active: boolean("active").default(true),
  sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
  sysUpdatedAt: timestamp("sys_updated_at", { withTimezone: true }).defaultNow(),
});
