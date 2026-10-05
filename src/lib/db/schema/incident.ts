import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { task } from "./task";
import { sysUser } from "./auth";

export const incident = pgTable("incident", {
  taskId: uuid("task_id").primaryKey().references(() => task.id),
  callerId: uuid("caller_id").notNull().references(() => sysUser.id),
  category: varchar("category", { length: 50 }).notNull().default("inquiry"),
  subcategory: varchar("subcategory", { length: 50 }),
  closeCode: varchar("close_code", { length: 50 }),
  closeNotes: text("close_notes"),
  holdReason: integer("hold_reason"),
  parentIncident: uuid("parent_incident").references(() => task.id),
  cmdbCiId: uuid("cmdb_ci_id"),
});

export const problem = pgTable("problem", {
  taskId: uuid("task_id").primaryKey().references(() => task.id),
  rootCause: text("root_cause"),
  workaround: text("workaround"),
  knownError: boolean("known_error").default(false),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

export const changeRequest = pgTable("change_request", {
  taskId: uuid("task_id").primaryKey().references(() => task.id),
  type: varchar("type", { length: 30 }).notNull().default("normal"),
  risk: integer("risk").notNull().default(3),
  approvalState: varchar("approval_state", { length: 30 }).default("not_requested"),
  cabRequired: boolean("cab_required").default(false),
  plannedStartDate: timestamp("planned_start_date", { withTimezone: true }),
  plannedEndDate: timestamp("planned_end_date", { withTimezone: true }),
  backoutPlan: text("backout_plan"),
  testPlan: text("test_plan"),
  implementationPlan: text("implementation_plan"),
});
