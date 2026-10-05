import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { task } from "./task";
import { sysUser } from "./auth";

export const sysJournalField = pgTable(
  "sys_journal_field",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => task.id),
    element: varchar("element", { length: 30 }).notNull(),
    value: text("value").notNull(),
    createdBy: uuid("created_by").notNull().references(() => sysUser.id),
    sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ idxJournalTaskElement: index("idx_journal_task_element").on(t.taskId, t.element) })
);

