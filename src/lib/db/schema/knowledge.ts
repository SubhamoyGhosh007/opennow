import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sysUser } from "./auth";
import { task } from "./task";

export const kbKnowledge = pgTable("kb_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: varchar("number", { length: 30 }).notNull().unique(),
  shortDescription: varchar("short_description", { length: 255 }).notNull(),
  text: text("text").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  workflowState: varchar("workflow_state", { length: 50 }).notNull().default("published"),
  authorId: uuid("author_id").references(() => sysUser.id),
  views: integer("views").default(0),
  helpfulCount: integer("helpful_count").default(0),
  sourceTaskId: uuid("source_task_id").references(() => task.id),
  sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
  sysUpdatedAt: timestamp("sys_updated_at", { withTimezone: true }).defaultNow(),
});
