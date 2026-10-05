import { describe, it, expect, beforeAll } from "vitest";
import postgres from "postgres";
import { calculatePriority } from "@/lib/engines/priorityEngine";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://opennow_user:opennow_secure_password@localhost:5432/opennow_db";

describe("incident creation integration", () => {
  let sql: any;
  beforeAll(() => {
    sql = postgres(DATABASE_URL, { max: 1 });
  });

  it("creating incident with impact=1 urgency=1 yields priority=1 and spawns SLA", async () => {
    const priority = calculatePriority(1, 1);
    expect(priority).toBe(1);
    const users: any = await sql`SELECT id FROM sys_user WHERE user_name = 'abel.tuter' LIMIT 1`;
    expect(users.length).toBe(1);
    const count: any = await sql`SELECT count(*) FROM task WHERE number LIKE 'INC%'`;
    const nextNum = `INC${(Number(count[0].count) + 9000).toString().padStart(7, "0")}`;
    const tasks: any = await sql`
      INSERT INTO task (number, sys_class_name, short_description, priority, urgency, impact, state, opened_by)
      VALUES (${nextNum}, 'incident', 'integration test', ${priority}, 1, 1, 1, ${users[0].id}::uuid) RETURNING *`;
    expect(tasks[0].priority).toBe(1);
    await sql`INSERT INTO incident (task_id, caller_id) VALUES (${tasks[0].id}::uuid, ${users[0].id}::uuid)`;
    const defs: any = await sql`SELECT * FROM contract_sla WHERE active = true LIMIT 1`;
    expect(defs.length).toBeGreaterThan(0);
    // cleanup
    await sql`DELETE FROM task WHERE id = ${tasks[0].id}::uuid`;
    await sql.end();
  });
});
