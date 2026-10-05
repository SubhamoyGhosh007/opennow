import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sysUser, sysUserGroup } from "./auth";

export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: varchar("number", { length: 32 }).notNull().unique(),
  sysClassName: varchar("sys_class_name", { length: 50 }).notNull(),
  shortDescription: varchar("short_description", { length: 255 }).notNull(),
  description: text("description"),
  priority: integer("priority").notNull().default(4),
  urgency: integer("urgency").notNull().default(3),
  impact: integer("impact").notNull().default(3),
  state: integer("state").notNull().default(1),
  assignedTo: uuid("assigned_to").references(() => sysUser.id),
  assignmentGroup: uuid("assignment_group").references(() => sysUserGroup.id),
  openedBy: uuid("opened_by").notNull().references(() => sysUser.id),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
  closedBy: uuid("closed_by").references(() => sysUser.id),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  active: boolean("active").default(true),
  sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
  sysUpdatedAt: timestamp("sys_updated_at", { withTimezone: true }).defaultNow(),
});

