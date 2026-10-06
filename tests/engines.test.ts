import { describe, it, expect } from "vitest";
import { calculatePriority } from "@/lib/engines/priorityEngine";
import { canTransition, assertTransition, IncidentState, ProblemState, ChangeState } from "@/lib/engines/stateEngine";
import { canWriteField, canReadField } from "@/lib/security/acl";
import { parseSysparmQuery, buildWhereClause } from "@/lib/engines/queryParser";
import { matchesCondition, businessMinutesToMs } from "@/lib/sla/evaluate";

describe("priority matrix", () => {
  it("impact=1 urgency=1 => priority 1", () => expect(calculatePriority(1, 1)).toBe(1));
  it("impact=2 urgency=2 => priority 3", () => expect(calculatePriority(2, 2)).toBe(3));
  it("impact=3 urgency=3 => priority 5", () => expect(calculatePriority(3, 3)).toBe(5));
});

describe("incident state machine", () => {
  it("New -> Closed is illegal", () => expect(canTransition(IncidentState.NEW, IncidentState.CLOSED)).toBe(false));
  it("New -> In Progress is legal", () => expect(canTransition(IncidentState.NEW, IncidentState.IN_PROGRESS)).toBe(true));
  it("Closed is terminal", () => expect(canTransition(IncidentState.CLOSED, IncidentState.IN_PROGRESS)).toBe(false));
});

describe("problem state machine", () => {
  it("Open -> Investigation is legal", () => {
    expect(canTransition(ProblemState.OPEN, ProblemState.INVESTIGATION, "problem")).toBe(true);
  });
  it("Investigation -> Known Error is legal", () => {
    expect(canTransition(ProblemState.INVESTIGATION, ProblemState.KNOWN_ERROR, "problem")).toBe(true);
  });
  it("Known Error -> Resolved is legal", () => {
    expect(canTransition(ProblemState.KNOWN_ERROR, ProblemState.RESOLVED, "problem")).toBe(true);
  });
  it("Resolved -> Closed is legal", () => {
    expect(canTransition(ProblemState.RESOLVED, ProblemState.CLOSED, "problem")).toBe(true);
  });
  it("Closed is terminal and throws assertTransition", () => {
    expect(canTransition(ProblemState.CLOSED, ProblemState.INVESTIGATION, "problem")).toBe(false);
    expect(() => assertTransition(ProblemState.CLOSED, ProblemState.INVESTIGATION, "problem")).toThrow();
  });
});

describe("change request state machine", () => {
  it("New -> Assess is legal", () => {
    expect(canTransition(ChangeState.NEW, ChangeState.ASSESS, "change_request")).toBe(true);
  });
  it("Assess -> Scheduled is legal", () => {
    expect(canTransition(ChangeState.ASSESS, ChangeState.SCHEDULED, "change_request")).toBe(true);
  });
  it("Scheduled -> Implementing is legal", () => {
    expect(canTransition(ChangeState.SCHEDULED, ChangeState.IMPLEMENTING, "change_request")).toBe(true);
  });
  it("Implementing -> Review is legal", () => {
    expect(canTransition(ChangeState.IMPLEMENTING, ChangeState.REVIEW, "change_request")).toBe(true);
  });
  it("Review -> Closed is legal", () => {
    expect(canTransition(ChangeState.REVIEW, ChangeState.CLOSED, "change_request")).toBe(true);
  });
  it("Direct New -> Closed is illegal", () => {
    expect(canTransition(ChangeState.NEW, ChangeState.CLOSED, "change_request")).toBe(false);
  });
});

describe("ACL", () => {
  it("non-itil cannot write work_notes", () => {
    expect(canWriteField({ user: { id: "u1", roles: ["employee"] }, record: { state: 2 }, field: "work_notes" })).toBe(false);
  });
  it("non-itil cannot read work_notes", () => {
    expect(canReadField({ user: { id: "u1", roles: ["employee"] }, record: {}, field: "work_notes" })).toBe(false);
  });
  it("closed records are read-only", () => {
    expect(canWriteField({ user: { id: "u1", roles: ["admin"] }, record: { state: 7 } })).toBe(false);
  });
});

describe("query parser", () => {
  it("parses AND clauses", () => {
    const c = parseSysparmQuery("priority=1^active=true^state!=7");
    expect(c).toHaveLength(3);
  });

  it("builds safe escaped where clause", () => {
    const conditions = parseSysparmQuery("priority=1^short_descriptionLIKEtest'quote^active=true");
    const allowed = new Set(["priority", "short_description", "active"]);
    const { clause } = buildWhereClause(conditions, allowed);
    expect(clause).toContain(`"priority" = 1`);
    expect(clause).toContain(`"short_description" ILIKE '%test''quote%'`);
    expect(clause).toContain(`"active" = true`);
  });
});

describe("SLA condition matcher and calculation", () => {
  it("matches priority condition", () => {
    expect(matchesCondition({ priority: 1, state: 1 }, { priority: 1 })).toBe(true);
  });
  it("matches array stop condition", () => {
    expect(matchesCondition({ state: 6 }, { state: [6, 7] })).toBe(true);
  });
  it("calculates SLA duration exceeding 7 calendar days correctly", () => {
    // 10 business days * 8 hours/day * 60 min = 4800 business minutes
    const start = new Date("2026-10-05T09:00:00Z"); // Monday 9am
    const end = businessMinutesToMs(4800, "8x5_weekdays", start);
    expect(end.getTime()).toBeGreaterThan(start.getTime() + 10 * 24 * 60 * 60 * 1000);
  });
});

