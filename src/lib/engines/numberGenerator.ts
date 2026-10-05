import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const PREFIX_MAP: Record<string, string> = {
  incident: "INC",
  change_request: "CHG",
  problem: "PRB",
  task: "TASK",
};

export function prefixFor(table: string): string {
  return PREFIX_MAP[table] ?? "TASK";
}

export async function generateNextNumber(prefix: string): Promise<string> {
  const result: any = await db.execute(sql`
    SELECT COALESCE(MAX(SUBSTRING(number FROM ${prefix.length + 1})::bigint), 0) as max_num
    FROM task
    WHERE number LIKE ${prefix + "%"}
  `);
  const rows = Array.isArray(result) ? result : result?.rows ?? [];
  const nextNum = Number(rows[0]?.max_num ?? 0) + 1;
  return `${prefix}${nextNum.toString().padStart(7, "0")}`;
}

