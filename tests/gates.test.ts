import { describe, it, expect } from "vitest";
import { gateForRequest } from "@/lib/security/gates";

describe("route gates", () => {
  it("anonymous page traffic goes to login", () => {
    expect(gateForRequest("/workspace/incident", null)).toEqual({ kind: "login" });
  });
  it("anonymous API traffic gets 401", () => {
    expect(gateForRequest("/api/now/table/incident", null)).toEqual({ kind: "unauthorized" });
  });
  it("employees are kept out of the fulfiller workspace", () => {
    expect(gateForRequest("/workspace/incident", ["employee"])).toEqual({
      kind: "redirect",
      to: "/tickets",
    });
  });
  it("the overview dashboard opens for every role", () => {
    expect(gateForRequest("/workspace", ["employee"])).toEqual({ kind: "allow" });
    expect(gateForRequest("/workspace", ["itil"])).toEqual({ kind: "allow" });
  });
  it("itil roles pass the workspace gate", () => {
    expect(gateForRequest("/workspace/change", ["itil"])).toEqual({ kind: "allow" });
    expect(gateForRequest("/workspace/problem", ["itil_admin"])).toEqual({ kind: "allow" });
    expect(gateForRequest("/workspace/incident/abc", ["admin"])).toEqual({ kind: "allow" });
  });
  it("any signed-in user reaches portal pages", () => {
    expect(gateForRequest("/catalog", ["employee"])).toEqual({ kind: "allow" });
    expect(gateForRequest("/tickets", ["employee"])).toEqual({ kind: "allow" });
  });
});
