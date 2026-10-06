"use client";
import * as React from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, BookOpen, Bug, ShieldAlert } from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { StateBadge, PriorityBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/deck/activity-feed";
import { AssignmentPanel } from "@/components/deck/assignment-panel";
import { Accordion } from "@/components/motion/accordion";
import { Modal } from "@/components/ui/dialog";
import { NumberPop } from "@/components/motion/micro";
import { navigateWithTransition } from "@/components/motion/nav-transition";
import { useToast } from "@/components/motion/toast";
import { canTransition } from "@/lib/engines/stateEngine";
import { useRouter } from "next/navigation";

const PROBLEM_STATES = [
  { v: 1, label: "Open" },
  { v: 2, label: "Investigation" },
  { v: 3, label: "Known Error" },
  { v: 6, label: "Resolved" },
  { v: 7, label: "Closed" },
  { v: 8, label: "Canceled" },
];

export default function ProblemDetailPage({ params }: { params: { id: string } }) {
  const [rec, setRec] = React.useState<any>(null);
  const [confirm, setConfirm] = React.useState<number | null>(null);
  const [savingAnalysis, setSavingAnalysis] = React.useState(false);
  const [analysis, setAnalysis] = React.useState({
    root_cause: "",
    workaround: "",
    known_error: false,
  });
  const toast = useToast();
  const router = useRouter();

  const load = React.useCallback(() => {
    fetch(`/api/now/table/problem/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.result) {
          setRec(j.result);
          setAnalysis({
            root_cause: j.result.root_cause || "",
            workaround: j.result.workaround || "",
            known_error: Boolean(j.result.known_error),
          });
        }
      })
      .catch((err) => console.error(err));
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateProblem = async (updates: Record<string, unknown>, toastMsg?: string) => {
    try {
      const res = await fetch(`/api/now/table/problem/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast({ title: toastMsg || "Problem record updated" });
        setConfirm(null);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast({ title: "Update failed", body: j.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message || "Failed to reach server" });
    }
  };

  const saveAnalysis = async () => {
    setSavingAnalysis(true);
    await updateProblem(
      {
        root_cause: analysis.root_cause,
        workaround: analysis.workaround,
        known_error: analysis.known_error,
      },
      "Root cause & workaround saved"
    );
    setSavingAnalysis(false);
  };

  const publishToKb = async () => {
    if (!analysis.workaround && !analysis.root_cause) {
      toast({ title: "Validation error", body: "Document a workaround or root cause first" });
      return;
    }
    try {
      const bodyText = `### Problem Reference\nGenerated from **${rec.number}**: ${rec.short_description}\n\n### Root Cause Analysis\n${analysis.root_cause || "Under active investigation."}\n\n### Workaround / Temporary Mitigation\n${analysis.workaround || "No current workaround."}`;
      const res = await fetch("/api/now/table/kb_knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_description: `Workaround: ${rec.short_description}`,
          category: "General",
          text: bodyText,
          source_task_id: rec.id,
          workflow_state: "published",
        }),
      });
      if (res.ok) {
        const j = await res.json();
        toast({ title: "KB Article Published", body: `Linked as ${j.result?.number}` });
      } else {
        toast({ title: "Failed to publish article" });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    }
  };

  const applyState = async (next: number) => {
    await updateProblem(
      { state: next },
      `Moved to ${PROBLEM_STATES.find((s) => s.v === next)?.label || `state ${next}`}`
    );
  };

  return (
    <WorkspaceShell title={rec ? rec.number : "Loading problem…"} tab="problem">
      <button
        onClick={() => navigateWithTransition(router, "/workspace/problem", "nav-back")}
        className="mb-3 flex items-center gap-1 text-[15px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to problem queue
      </button>

      {rec ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-ticket text-xl font-bold tracking-tight text-[hsl(var(--signal))]">
                  {rec.number}
                </span>
                <StateBadge state={rec.state} />
                <PriorityBadge priority={rec.priority} />
                {rec.known_error && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Known Error
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_STATES.filter((s) => s.v !== rec.state && canTransition(rec.state, s.v, "problem")).map(
                  (s) => (
                    <Button
                      key={s.v}
                      size="sm"
                      variant={s.v === 6 ? "signal" : s.v === 8 ? "destructive" : "outline"}
                      onClick={() => setConfirm(s.v)}
                    >
                      Move to {s.label}
                    </Button>
                  )
                )}
              </div>
            </div>
            <h1 className="mt-3 text-lg font-semibold">{rec.short_description}</h1>
            {rec.description && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{rec.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Left 2 Cols: Root Cause Analysis & Problem Lifecycle */}
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2 font-medium">
                    <Bug className="h-4 w-4 text-[hsl(var(--signal))]" />
                    <span>Root Cause Analysis & Workaround</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={analysis.known_error}
                      disabled={rec.state >= 7}
                      onChange={(e) =>
                        setAnalysis({ ...analysis, known_error: e.target.checked })
                      }
                      className="rounded border-input text-[hsl(var(--signal))] focus:ring-[hsl(var(--signal))]"
                    />
                    Flag as Known Error
                  </label>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Workaround
                    </label>
                    <textarea
                      rows={3}
                      value={analysis.workaround}
                      disabled={rec.state >= 7}
                      placeholder="Document interim mitigation or workaround for fulfillers..."
                      onChange={(e) => setAnalysis({ ...analysis, workaround: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Root Cause
                    </label>
                    <textarea
                      rows={4}
                      value={analysis.root_cause}
                      disabled={rec.state >= 7}
                      placeholder="Technical root cause analysis (e.g., deadlock in connection pool, memory leak)..."
                      onChange={(e) => setAnalysis({ ...analysis, root_cause: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    />
                  </div>

                  {rec.state < 7 && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={publishToKb}
                        title="Publish this workaround to the enterprise Knowledge Base"
                      >
                        Publish to Knowledge Base
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={saveAnalysis}
                        disabled={savingAnalysis}
                      >
                        {savingAnalysis ? "Saving..." : "Save Analysis"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity & Journaling */}
              <ActivityFeed
                taskId={params.id}
                journals={rec.journals || []}
                table="problem"
                onUpdate={load}
              />
            </div>

            {/* Right Col: Routing & Problem Metadata */}
            <div className="space-y-4">
              <AssignmentPanel
                table="problem"
                taskId={params.id}
                assignedTo={rec.assigned_to}
                assignmentGroup={rec.assignment_group}
                isClosed={rec.state >= 7}
                onUpdate={load}
              />
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Problem Metadata
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">State</span>
                    <span className="font-medium">
                      {PROBLEM_STATES.find((s) => s.v === rec.state)?.label || rec.state}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="font-ticket font-medium">P{rec.priority}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Impact</span>
                    <span className="font-medium">{rec.impact}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Urgency</span>
                    <span className="font-medium">{rec.urgency}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Known Error</span>
                    <span className="font-medium">{rec.known_error ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-ticket text-muted-foreground">
                      {new Date(rec.sys_created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-ticket text-muted-foreground">
                      {new Date(rec.sys_updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related CMDB / Incidents Info */}
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ITSM Governance
                </h3>
                <p className="text-xs text-muted-foreground">
                  Problems identify recurring incident patterns, determine root causes, and publish workarounds to prevent service degradation.
                </p>
              </div>
            </div>
          </div>

          {/* Confirm State Transition Dialog */}
          <Modal
            open={confirm !== null}
            onOpenChange={(v) => !v && setConfirm(null)}
          >
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">
                Transition Problem to {PROBLEM_STATES.find((s) => s.v === confirm)?.label || ""}
              </h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to advance this problem record to{" "}
                <span className="font-semibold text-foreground">
                  {PROBLEM_STATES.find((s) => s.v === confirm)?.label}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant={confirm === 8 ? "destructive" : "signal"}
                  onClick={() => confirm !== null && applyState(confirm)}
                >
                  Confirm Transition
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Loading problem record...
        </div>
      )}
    </WorkspaceShell>
  );
}
