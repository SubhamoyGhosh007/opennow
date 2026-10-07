export function isItil(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("itil") || roles.includes("itil_admin");
}

export function isAdmin(roles: string[]): boolean {
  return roles.includes("admin");
}

export type GateDecision =
  | { kind: "allow" }
  | { kind: "login" }
  | { kind: "unauthorized" }
  | { kind: "redirect"; to: string };

/**
 * Pure route gate used by middleware (and unit tests).
 * - No session → login page, or 401 JSON for API calls.
 * - /workspace/* record queues stay fulfiller-only (admin/itil/itil_admin).
 * - The overview dashboard plus read-only inventory/articles are open to
 *   every authenticated role.
 */
const OPEN_TO_ALL_EXACT = ["/workspace"];
const OPEN_TO_ALL_PREFIXES = ["/workspace/cmdb", "/workspace/knowledge"];

export function gateForRequest(pathname: string, roles: string[] | null): GateDecision {
  const isApi = pathname.startsWith("/api/");
  if (!roles) {
    return isApi ? { kind: "unauthorized" } : { kind: "login" };
  }
  if (pathname.startsWith("/workspace") && !isItil(roles)) {
    if (
      OPEN_TO_ALL_EXACT.includes(pathname) ||
      OPEN_TO_ALL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      return { kind: "allow" };
    }
    return isApi ? { kind: "unauthorized" } : { kind: "redirect", to: "/tickets" };
  }
  if (pathname.startsWith("/admin") && !isAdmin(roles)) {
    return isApi ? { kind: "unauthorized" } : { kind: "redirect", to: "/" };
  }
  return { kind: "allow" };
}
