import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { task } from "./task";

export const contractSla = pgTable("contract_sla", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  target: varchar("target", { length: 30 }).notNull(),
  targetTable: varchar("target_table", { length: 50 }).notNull().default("incident"),
  durationMinutes: integer("duration_minutes").notNull(),
  schedule: varchar("schedule", { length: 30 }).default("24x7"),
  startCondition: jsonb("start_condition").notNull(),
  pauseCondition: jsonb("pause_condition"),
  stopCondition: jsonb("stop_condition").notNull(),
  active: boolean("active").default(true),
});

export const taskSla = pgTable(
  "task_sla",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => task.id),
    slaDefinitionId: uuid("sla_definition_id").notNull().references(() => contractSla.id),

    stage: varchar("stage", { length: 30 }).notNull().default("in_progress"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    pauseTime: timestamp("pause_time", { withTimezone: true }),
    pauseDurationSeconds: integer("pause_duration_seconds").default(0),
    plannedEndTime: timestamp("planned_end_time", { withTimezone: true }).notNull(),
    actualEndTime: timestamp("actual_end_time", { withTimezone: true }),
    percentageElapsed: numeric("percentage_elapsed", { precision: 5, scale: 2 }).default("0.00"),
    hasBreached: boolean("has_breached").default(false),
  },
  (t) => ({ idxTaskSlaMonitoring: index("idx_task_sla_monitoring").on(t.stage, t.plannedEndTime) })
);
