import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { inet } from "./inet-helper";

export const cmdbCi = pgTable("cmdb_ci", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  sysClassName: varchar("sys_class_name", { length: 100 }).notNull(),
  operationalStatus: varchar("operational_status", { length: 50 }).default("operational"),
  ipAddress: inet("ip_address"),
  fqdn: varchar("fqdn", { length: 255 }),
  ownedBy: uuid("owned_by"),
  sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
});

export const cmdbRelCi = pgTable("cmdb_rel_ci", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").notNull(),
  childId: uuid("child_id").notNull(),
  relationType: varchar("relation_type", { length: 50 }).notNull(),
});
