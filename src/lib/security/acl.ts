export interface ACLContext {
  user: { id: string; roles: string[] };
  record: any;
  field?: string;
}

export function canWriteField(ctx: ACLContext): boolean {
  if ([7, 8].includes(ctx.record?.state)) return false;
  if (ctx.field === "work_notes") {
    return ctx.user.roles.includes("itil") || ctx.user.roles.includes("admin");
  }
  if (ctx.field === "comments") {
    if (ctx.user.roles.includes("itil") || ctx.user.roles.includes("admin")) return true;
    return ctx.record.caller_id === ctx.user.id || ctx.record.opened_by === ctx.user.id;
  }
  return true;
}

export function canReadField(ctx: ACLContext): boolean {
  if (ctx.field === "work_notes") {
    return ctx.user.roles.includes("itil") || ctx.user.roles.includes("admin");
  }
  return true;
}

export function isItil(roles: string[]): boolean {
  return roles.includes("itil") || roles.includes("admin") || roles.includes("itil_admin");
}
