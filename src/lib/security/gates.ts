export function isItil(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("itil") || roles.includes("itil_admin");
}

export type GateDecision =
  | { kind: "allow" }
  | { kind: "login" }
  | { kind: "unauthorized" }
  | { kind: "redirect"; to: string };

/**
 * Pure route gate used by middleware (and unit tests).
 * - No session → login page, or 401 JSON for API calls.
 * - /workspace/* requires an fulfiller role (admin/itil/itil_admin).
 */
export function gateForRequest(pathname: string, roles: string[] | null): GateDecision {
  const isApi = pathname.startsWith("/api/");
  if (!roles) {
    return isApi ? { kind: "unauthorized" } : { kind: "login" };
  }
  if (pathname.startsWith("/workspace") && !isItil(roles)) {
    // The overview dashboard is every role's front door; only the record
    // queues stay fulfiller-only.
    if (pathname === "/workspace") return { kind: "allow" };
    return isApi ? { kind: "unauthorized" } : { kind: "redirect", to: "/tickets" };
  }
  return { kind: "allow" };
}
