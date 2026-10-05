import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const sysUser: any = pgTable("sys_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  userName: varchar("user_name", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  title: varchar("title", { length: 150 }),
  department: varchar("department", { length: 150 }),
  managerId: uuid("manager_id").references((): any => sysUser.id),
  vip: boolean("vip").default(false),
  active: boolean("active").default(true),
  sysCreatedAt: timestamp("sys_created_at", { withTimezone: true }).defaultNow(),
  sysUpdatedAt: timestamp("sys_updated_at", { withTimezone: true }).defaultNow(),
});

export const sysUserGroup = pgTable("sys_user_group", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  managerId: uuid("manager_id").references(() => sysUser.id),
  active: boolean("active").default(true),
});

export const sysUserGrmember = pgTable("sys_user_grmember", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => sysUser.id),
  groupId: uuid("group_id").notNull().references(() => sysUserGroup.id),
});

export const sysUserRole = pgTable("sys_user_role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const sysUserHasRole = pgTable("sys_user_has_role", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => sysUser.id),
  roleId: uuid("role_id").notNull().references(() => sysUserRole.id),
});

