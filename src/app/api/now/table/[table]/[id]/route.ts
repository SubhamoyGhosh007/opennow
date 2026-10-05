import { NextResponse } from "next/server";
import { getSql, TABLE_MAP, getUserContext } from "@/lib/api/tableApi";
import { calculatePriority } from "@/lib/engines/priorityEngine";
import { assertTransition } from "@/lib/engines/stateEngine";
import { canWriteField } from "@/lib/security/acl";
import { matchesCondition, businessMinutesToMs } from "@/lib/sla/evaluate";

export async function GET(req: Request, { params }: { params: { table: string; id: string } }) {
  const { table, id } = params;
  if (!TABLE_MAP[table]) return NextResponse.json({ error: `Unknown table ${table}` }, { status: 400 });
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: "Invalid UUID format" }, { status: 400 });

  const sql = getSql();
  try {
    if (["incident", "change_request", "problem", "task"].includes(table)) {
      const ext = TABLE_MAP[table].ext;
      const rows: any = ext
        ? await sql`SELECT t.*, e.* FROM task t LEFT JOIN ${sql(ext)} e ON e.task_id = t.id WHERE t.id = ${id}::uuid LIMIT 1`
        : await sql`SELECT * FROM task WHERE id = ${id}::uuid LIMIT 1`;
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const journals: any = await sql`SELECT * FROM sys_journal_field WHERE task_id = ${id}::uuid ORDER BY sys_created_at ASC`;
      const slas: any = await sql`SELECT s.*, c.name as sla_name FROM task_sla s JOIN contract_sla c ON c.id = s.sla_definition_id WHERE s.task_id = ${id}::uuid`;
      return NextResponse.json({ result: { ...rows[0], journals, slas } });
    }

    if (table === "sys_user") {
      const rows: any = await sql`
        SELECT id, user_name, email, first_name, last_name, title, department, manager_id, vip, active, sys_created_at, sys_updated_at
        FROM sys_user WHERE id = ${id}::uuid LIMIT 1
      `;
      if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ result: rows[0] });
    }

    const rows: any = await sql.unsafe(`SELECT * FROM ${table} WHERE id = '${id}'::uuid LIMIT 1`);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ result: rows[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { table: string; id: string } }) {
  const { table, id } = params;
  if (!TABLE_MAP[table] || !["incident", "change_request", "problem", "task"].includes(table)) {
    return NextResponse.json({ error: "PATCH only supported for task hierarchy" }, { status: 400 });
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: "Invalid UUID format" }, { status: 400 });

  const body = await req.json();
  const ctx = await getUserContext(req);
  const sql = getSql();
  const userId = ctx.id;
  const roles: string[] = ctx.roles || [];
  try {
    const existing: any = await sql`SELECT * FROM task WHERE id = ${id}::uuid`;
    if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const rec = existing[0];

    // State transition enforcement
    if (body.state && Number(body.state) !== rec.state) {
      try {
        assertTransition(rec.state, Number(body.state));
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 422 });
      }
    }

    // ACL: closed records read-only
    if (!canWriteField({ user: { id: userId, roles }, record: rec })) {
      return NextResponse.json({ error: "Record is closed/canceled and read-only" }, { status: 403 });
    }

    let priority = rec.priority;
    const impact = body.impact ?? rec.impact;
    const urgency = body.urgency ?? rec.urgency;
    if (body.impact !== undefined || body.urgency !== undefined) {
      priority = calculatePriority(Number(impact), Number(urgency));
    }

    const sets: string[] = [`priority = ${priority}`, `impact = ${Number(impact)}`, `urgency = ${Number(urgency)}`, `sys_updated_at = NOW()`];
    const esc = (v: any) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
    if (body.short_description) sets.push(`short_description = ${esc(body.short_description)}`);
    if (body.description !== undefined) sets.push(`description = ${esc(body.description)}`);
    if (body.state) {
      const nextState = Number(body.state);
      sets.push(`state = ${nextState}`);
      if (nextState === 7 || nextState === 8) {
        sets.push(`active = false`);
        sets.push(`closed_at = NOW()`);
      } else {
        sets.push(`active = true`);
      }
    }
    if (body.assigned_to) sets.push(`assigned_to = ${esc(body.assigned_to)}::uuid`);
    if (body.assignment_group) sets.push(`assignment_group = ${esc(body.assignment_group)}::uuid`);

    await sql.unsafe(`UPDATE task SET ${sets.join(", ")} WHERE id = '${id}'::uuid`);

    // Extension updates
    if (table === "incident") {
      const extSets: string[] = [];
      if (body.category) extSets.push(`category = ${esc(body.category)}`);
      if (body.close_code) extSets.push(`close_code = ${esc(body.close_code)}`);
      if (body.close_notes) extSets.push(`close_notes = ${esc(body.close_notes)}`);
      if (body.hold_reason !== undefined) extSets.push(`hold_reason = ${Number(body.hold_reason)}`);
      if (extSets.length) await sql.unsafe(`UPDATE incident SET ${extSets.join(", ")} WHERE task_id = '${id}'::uuid`);
    }

    // Journals with ACL
    if (body.work_notes) {
      if (!canWriteField({ user: { id: userId, roles }, record: rec, field: "work_notes" })) {
        return NextResponse.json({ error: "Forbidden: work_notes requires itil role" }, { status: 403 });
      }
      await sql`INSERT INTO sys_journal_field (task_id, element, value, created_by) VALUES (${id}::uuid, 'work_notes', ${body.work_notes}, ${userId}::uuid)`;
    }
    if (body.comments || body.additional_comments) {
      const extRec: any = table === "incident" ? (await sql`SELECT * FROM incident WHERE task_id = ${id}::uuid`)[0] : {};
      const fullRec = { ...rec, ...(extRec || {}) };
      if (!canWriteField({ user: { id: userId, roles }, record: fullRec, field: "comments" })) {
        return NextResponse.json({ error: "Forbidden: cannot post comments" }, { status: 403 });
      }
      await sql`INSERT INTO sys_journal_field (task_id, element, value, created_by) VALUES (${id}::uuid, 'comments', ${body.comments || body.additional_comments}, ${userId}::uuid)`;
    }

    // SLA stop/pause evaluation
    try {
      const updated: any = (await sql`SELECT * FROM task WHERE id = ${id}::uuid`)[0];
      const openSlas: any = await sql`SELECT s.*, c.stop_condition, c.pause_condition FROM task_sla s JOIN contract_sla c ON c.id = s.sla_definition_id WHERE s.task_id = ${id}::uuid AND s.stage = 'in_progress'`;
      for (const s of openSlas) {
        if (s.stop_condition && matchesCondition(updated, s.stop_condition)) {
          await sql`UPDATE task_sla SET stage = 'achieved', actual_end_time = NOW() WHERE id = ${s.id}::uuid`;
        } else if (s.pause_condition && matchesCondition({ ...updated, hold_reason: body.hold_reason }, s.pause_condition)) {
          await sql`UPDATE task_sla SET stage = 'paused', pause_time = NOW() WHERE id = ${s.id}::uuid`;
        }
      }
    } catch {}

    const finalRows: any = await sql`SELECT * FROM task WHERE id = ${id}::uuid`;
    return NextResponse.json({ result: finalRows[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
