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
  sys_user: { base: "sys_user", className: "sys_user", prefix: "" },
};

export async function getUserContext(req: Request): Promise<{ id: string; roles: string[] }> {
  // 1. NextAuth session
  try {
    const session: any = await auth();
    if (session?.user?.id) {
      return { id: session.user.id as string, roles: (session.user.roles as string[]) || [] };
    }
  } catch {}

  // 2. Local development header fallback (disabled in production)
  if (process.env.NODE_ENV !== "production") {
    const headerId = req.headers.get("x-user-id");
    if (headerId && /^[0-9a-fA-F-]{36}$/.test(headerId)) {
      const sql = getSql();
      try {
        const roles = await sql`SELECT r.name FROM sys_user_role r JOIN sys_user_has_role hr ON hr.role_id = r.id WHERE hr.user_id = ${headerId}::uuid`;
        return { id: headerId, roles: roles.map((r: any) => r.name) };
      } catch {}
    }
  }

  // 3. Unauthenticated default
  return { id: "", roles: [] };
}
