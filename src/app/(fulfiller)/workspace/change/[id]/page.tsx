"use client";
import * as React from "react";
import { ArrowLeft, CheckCircle2, XCircle, ShieldAlert, Calendar, Layers } from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { StateBadge, PriorityBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityFeed } from "@/components/deck/activity-feed";
import { AssignmentPanel } from "@/components/deck/assignment-panel";
import { Accordion } from "@/components/motion/accordion";
import { Modal } from "@/components/ui/dialog";
import { NumberPop } from "@/components/motion/micro";
import { navigateWithTransition } from "@/components/motion/nav-transition";
import { useToast } from "@/components/motion/toast";
import { useRouter } from "next/navigation";

const CHANGE_STATES = [
  { v: 1, label: "Draft" },
  { v: 2, label: "Assess" },
  { v: 3, label: "Scheduled" },
  { v: 4, label: "Implement" },
  { v: 6, label: "Review" },
  { v: 7, label: "Close" },
  { v: 8, label: "Cancel" },
];

export default function ChangeDetailPage({ params }: { params: { id: string } }) {
  const [rec, setRec] = React.useState<any>(null);
  const [confirm, setConfirm] = React.useState<number | null>(null);
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [plans, setPlans] = React.useState({
    implementation_plan: "",
    backout_plan: "",
    test_plan: "",
  });
  const toast = useToast();
  const router = useRouter();

  const load = React.useCallback(() => {
    fetch(`/api/now/table/change_request/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.result) {
          setRec(j.result);
          setPlans({
            implementation_plan: j.result.implementation_plan || "",
            backout_plan: j.result.backout_plan || "",
            test_plan: j.result.test_plan || "",
          });
        }
      });
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateChange = async (updates: Record<string, unknown>, toastMsg?: string) => {
    try {
      const res = await fetch(`/api/now/table/change_request/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast({ title: toastMsg || "Change updated" });
        setConfirm(null);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast({ title: "Update rejected", body: j.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message || "Failed to reach server" });
    }
  };

  const savePlans = async () => {
    setSavingPlan(true);
    await updateChange(plans, "Planning documents saved");
    setSavingPlan(false);
  };

  const handleApproval = (action: "requested" | "approved" | "rejected") => {
    if (action === "approved") {
      updateChange({ approval_state: "approved", state: 3 }, "Change approved & scheduled");
    } else if (action === "rejected") {
      updateChange({ approval_state: "rejected", state: 1 }, "Change rejected (returned to Draft)");
    } else {
      updateChange({ approval_state: "requested", state: 2 }, "Approval requested from CAB");
    }
  };

  const riskLabel = (r: number) => {
    if (r === 1) return { label: "High Risk", variant: "destructive" as const };
    if (r === 2) return { label: "Medium Risk", variant: "warning" as const };
    return { label: "Low Risk", variant: "secondary" as const };
  };

  const approvalBadge = (app: string) => {
    if (app === "approved") return <Badge variant="signal">Approved</Badge>;
    if (app === "requested") return <Badge variant="warning">Approval Requested</Badge>;
    if (app === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Not Requested</Badge>;
  };

  return (
    <WorkspaceShell title={rec ? rec.number : "Loading change…"} tab="change">
      <button
        onClick={() => navigateWithTransition(router, "/workspace/change", "nav-back")}
        className="mb-3 flex items-center gap-1 text-[15px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Change Queue
      </button>

      {!rec ? (
        <p className="text-[15px] text-muted-foreground">Loading change request…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="deck-panel space-y-4 p-5">
            <div>
              <p className="font-ticket text-2xl font-bold text-[hsl(var(--signal))]" style={{ viewTransitionName: `ticket-${rec.id}` }}>
                {rec.number}
              </p>
              <h1 className="font-display mt-1 text-2xl font-semibold leading-tight">{rec.short_description}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={rec.priority} />
                <StateBadge state={rec.state} />
                {approvalBadge(rec.approval_state || "not_requested")}
                <Badge variant={riskLabel(rec.risk || 3).variant}>{riskLabel(rec.risk || 3).label}</Badge>
                <Badge variant="outline" className="capitalize">{rec.type || "normal"} change</Badge>
              </div>
            </div>

            <p className="text-[15px] leading-relaxed text-muted-foreground">{rec.description || "No description provided."}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-ticket text-[13px]">
              <div><dt className="text-muted-foreground">Type</dt><dd className="font-sans font-medium capitalize">{rec.type}</dd></div>
              <div><dt className="text-muted-foreground">CAB Required</dt><dd className="font-sans font-medium">{rec.cab_required ? "Yes (Mandatory)" : "No"}</dd></div>
              <div><dt className="text-muted-foreground">Priority</dt><dd><NumberPop value={rec.priority} /></dd></div>
            </dl>

            {/* Approval Action Bar */}
            <div className="rounded-lg border border-border/80 bg-card/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approval Decision</span>
                <span className="text-xs text-muted-foreground">Status: <span className="font-medium text-foreground">{rec.approval_state || "not_requested"}</span></span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {rec.approval_state !== "approved" && (
                  <Button size="sm" variant="default" onClick={() => handleApproval("approved")} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Approve Change
                  </Button>
                )}
                {rec.approval_state !== "requested" && rec.approval_state !== "approved" && (
                  <Button size="sm" variant="outline" onClick={() => handleApproval("requested")}>
                    Request CAB Approval
                  </Button>
                )}
                {rec.approval_state !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => handleApproval("rejected")} className="gap-1.5">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                )}
              </div>
            </div>

            {/* State Transition Controls */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phase Transition</span>
              <div className="flex flex-wrap items-center gap-2">
                {CHANGE_STATES.filter((s) => s.v !== rec.state).map((s) => (
                  <Button
                    key={s.v}
                    size="sm"
                    variant={s.v === 4 ? "signal" : "outline"}
                    onClick={() => (s.v === 7 || s.v === 8 ? setConfirm(s.v) : updateChange({ state: s.v }, `Moved to ${s.label}`))}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Change Planning Accordion */}
            <Accordion title="Execution, Test & Backout Plans" defaultOpen>
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Implementation Plan</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Step-by-step procedure to deploy the change..."
                    value={plans.implementation_plan}
                    onChange={(e) => setPlans({ ...plans, implementation_plan: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Backout / Rollback Plan</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Procedure to revert to prior state if change fails..."
                    value={plans.backout_plan}
                    onChange={(e) => setPlans({ ...plans, backout_plan: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Verification & Test Plan</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Validation checks to confirm success..."
                    value={plans.test_plan}
                    onChange={(e) => setPlans({ ...plans, test_plan: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="signal" onClick={savePlans} disabled={savingPlan}>
                    {savingPlan ? "Saving…" : "Save Plans"}
                  </Button>
                </div>
              </div>
            </Accordion>

            {/* Schedule Windows */}
            <Accordion title="Schedule & Risk Controls">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Planned Start</dt>
                  <dd className="font-ticket">{rec.planned_start_date ? new Date(rec.planned_start_date).toLocaleString() : "Not scheduled"}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Planned End</dt>
                  <dd className="font-ticket">{rec.planned_end_date ? new Date(rec.planned_end_date).toLocaleString() : "Not scheduled"}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Risk Assessment</dt>
                  <dd className="font-medium">Level {rec.risk || 3}</dd>
                </div>
              </dl>
            </Accordion>
          </div>

          <div className="space-y-4">
            <AssignmentPanel
              table="change_request"
              taskId={params.id}
              assignedTo={rec.assigned_to}
              assignmentGroup={rec.assignment_group}
              isClosed={rec.state >= 7}
              onUpdate={load}
            />
            <ActivityFeed journals={rec.journals} taskId={params.id} table="change_request" onUpdate={load} />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Terminal States */}
      <Modal open={confirm !== null} onOpenChange={(v) => !v && setConfirm(null)}>
        <h2 className="font-display text-2xl font-semibold">
          {confirm === 7 ? "Close this change request?" : "Cancel this change request?"}
        </h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {confirm === 7 ? "Marking as Closed will lock the change and record resolution." : "Canceling will abandon planned implementations."}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>Dismiss</Button>
          <Button
            variant={confirm === 7 ? "default" : "destructive"}
            onClick={() => confirm && updateChange({ state: confirm }, `Change ${confirm === 7 ? "closed" : "canceled"}`)}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </WorkspaceShell>
  );
}
