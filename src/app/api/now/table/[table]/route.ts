import { NextResponse } from "next/server";
import { getSql, TABLE_MAP, getUserContext } from "@/lib/api/tableApi";
import { calculatePriority } from "@/lib/engines/priorityEngine";
import { generateNextNumber } from "@/lib/engines/numberGenerator";
import { parseSysparmQuery, buildWhereClause } from "@/lib/engines/queryParser";
import { matchesCondition, businessMinutesToMs } from "@/lib/sla/evaluate";

const TASK_FIELDS = new Set([
  "id", "number", "sys_class_name", "short_description", "description", "priority",
  "urgency", "impact", "state", "assigned_to", "assignment_group", "opened_by",
  "opened_at", "closed_by", "closed_at", "active", "sys_created_at", "sys_updated_at",
]);

const USER_SAFE_FIELDS = [
  "id", "user_name", "email", "first_name", "last_name", "title", "department",
  "manager_id", "vip", "active", "sys_created_at", "sys_updated_at"
];

export async function GET(req: Request, { params }: { params: { table: string } }) {
  const table = params.table;
  if (!TABLE_MAP[table]) return NextResponse.json({ error: `Unknown table ${table}` }, { status: 400 });
  if (!(await getUserContext(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const sysparmQuery = url.searchParams.get("sysparm_query") || undefined;
  const limit = Math.min(Number(url.searchParams.get("sysparm_limit") || 50), 200);
  const offset = Number(url.searchParams.get("sysparm_offset") || 0);
  const fields = url.searchParams.get("sysparm_fields")?.split(",").map((s) => s.trim()).filter(Boolean);

  const sql = getSql();
  try {
    if (table === "incident" || table === "change_request" || table === "problem" || table === "task") {
      const conditions = parseSysparmQuery(sysparmQuery);
      const { clause } = buildWhereClause(conditions, TASK_FIELDS);
      const selectCols = fields && fields.length ? fields.filter((f) => TASK_FIELDS.has(f)).map((f) => `t."${f}"`).join(", ") : "t.*";
      const rows = await sql.unsafe(
        `SELECT ${selectCols}, e.* FROM task t LEFT JOIN ${table === "task" ? "task e ON false" : `${TABLE_MAP[table].ext} e ON e.task_id = t.id`} ${table === "task" ? "" : `WHERE t.sys_class_name = '${table === "incident" ? "incident" : table}'`} ${clause ? (table === "task" ? clause : clause.replace("WHERE", "AND")) : ""} ORDER BY t.sys_created_at DESC LIMIT ${limit} OFFSET ${offset}`
      );
      return NextResponse.json({ result: rows });
    }

    if (table === "sys_user") {
      const rows = await sql.unsafe(
        `SELECT ${USER_SAFE_FIELDS.join(", ")} FROM sys_user ORDER BY 1 LIMIT ${limit} OFFSET ${offset}`
      );
      return NextResponse.json({ result: rows });
    }

    const rows = await sql.unsafe(`SELECT * FROM ${table} ORDER BY 1 LIMIT ${limit} OFFSET ${offset}`);
    return NextResponse.json({ result: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { table: string } }) {
  const table = params.table;
  if (!TABLE_MAP[table]) return NextResponse.json({ error: `Unknown table ${table}` }, { status: 400 });
  const body = await req.json();
  const ctx = await getUserContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getSql();
  const userId = ctx.id;
  try {
    if (!["incident", "change_request", "problem", "task"].includes(table)) {
      return NextResponse.json({ error: "POST only supported for task hierarchy in MVP" }, { status: 400 });
    }
    const impact = Number(body.impact ?? 3);
    const urgency = Number(body.urgency ?? 3);
    const priority = calculatePriority(impact, urgency);
    const prefix = TABLE_MAP[table].prefix;
    const nextNum = await generateNextNumber(prefix);
    const className = table === "task" ? body.sys_class_name || "incident" : TABLE_MAP[table].className;

    const taskRows: any = await sql`
      INSERT INTO task (number, sys_class_name, short_description, description, priority, urgency, impact, state, opened_by, assigned_to, assignment_group)
      VALUES (${nextNum}, ${className}, ${body.short_description || "No short description"}, ${body.description || null}, ${priority}, ${urgency}, ${impact}, ${body.state || 1}, ${body.opened_by || (userId ? userId : null) || body.caller_id}, ${body.assigned_to || null}, ${body.assignment_group || null})
      RETURNING *`;
    const created = taskRows[0];

    if (table === "incident") {
      await sql`
        INSERT INTO incident (task_id, caller_id, category, subcategory, cmdb_ci_id)
        VALUES (${created.id}::uuid, ${body.caller_id || body.opened_by || (userId ? userId : null)}::uuid, ${body.category || "inquiry"}, ${body.subcategory || null}, ${body.cmdb_ci_id || null})`;
    } else if (table === "problem") {
      await sql`
        INSERT INTO problem (task_id, root_cause, workaround, known_error)
        VALUES (${created.id}::uuid, ${body.root_cause || null}, ${body.workaround || null}, ${body.known_error || false})`;
    } else if (table === "change_request") {
      await sql`
        INSERT INTO change_request (task_id, type, risk, backout_plan, test_plan, implementation_plan)
        VALUES (${created.id}::uuid, ${body.type || "normal"}, ${body.risk || 3}, ${body.backout_plan || null}, ${body.test_plan || null}, ${body.implementation_plan || null})`;
    }

    // Journals
    if (body.work_notes && userId) {
      await sql`INSERT INTO sys_journal_field (task_id, element, value, created_by) VALUES (${created.id}::uuid, 'work_notes', ${body.work_notes}, ${userId}::uuid)`;
    }
    if ((body.comments || body.additional_comments) && (userId || body.caller_id)) {
      await sql`INSERT INTO sys_journal_field (task_id, element, value, created_by) VALUES (${created.id}::uuid, 'comments', ${body.comments || body.additional_comments}, ${(userId || body.caller_id)}::uuid)`;
    }

    // SLA attach
    try {
      const defs: any = await sql`SELECT * FROM contract_sla WHERE active = true AND target_table = ${table === "task" ? className : table}`;
      for (const d of defs) {
        const rec: any = { ...created, priority, state: created.state };
        if (matchesCondition(rec, d.start_condition)) {
          const start = new Date();
          const end = businessMinutesToMs(d.duration_minutes, d.schedule, start);
          await sql`
            INSERT INTO task_sla (task_id, sla_definition_id, stage, start_time, planned_end_time)
            VALUES (${created.id}::uuid, ${d.id}::uuid, 'in_progress', ${start.toISOString()}::timestamptz, ${end.toISOString()}::timestamptz) RETURNING id`;
        }
      }
    } catch {}

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
