import { pgClient } from "@/lib/db";
import { auth } from "@/auth";

export function getSql() {
  return pgClient;
}

export const TABLE_MAP: Record<string, { base: string; className: string; prefix: string; ext?: string }> = {
  incident: { base: "task", className: "incident", prefix: "INC", ext: "incident" },
  change_request: { base: "task", className: "change_request", prefix: "CHG", ext: "change_request" },
  problem: { base: "task", className: "problem", prefix: "PRB", ext: "problem" },
  task: { base: "task", className: "task", prefix: "TASK" },
  cmdb_ci: { base: "cmdb_ci", className: "cmdb_ci", prefix: "" },
  cmdb_rel_ci: { base: "cmdb_rel_ci", className: "cmdb_rel_ci", prefix: "" },
  sys_user: { base: "sys_user", className: "sys_user", prefix: "" },
  contract_sla: { base: "contract_sla", className: "contract_sla", prefix: "" },
  task_sla: { base: "task_sla", className: "task_sla", prefix: "" },
};

export async function getUserContext(req: Request): Promise<{ id: string; roles: string[] } | null> {
  // Strict session auth — no header or admin fallbacks. Middleware already
  // rejects unauthenticated traffic; this is defense-in-depth (401).
  try {
    const session: any = await auth();
    if (session?.user?.id) {
      return { id: session.user.id as string, roles: (session.user.roles as string[]) || [] };
    }
  } catch {}
  return null;
}
