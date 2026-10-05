"use client";
import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { StateBadge, PriorityBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityFeed } from "@/components/deck/activity-feed";
import { Accordion } from "@/components/motion/accordion";
import { Modal } from "@/components/ui/dialog";
import { NumberPop, SuccessCheck } from "@/components/motion/micro";
import { TransitionLink, navigateWithTransition } from "@/components/motion/nav-transition";
import { useToast } from "@/components/motion/toast";
import { canTransition } from "@/lib/engines/stateEngine";
import { useRouter } from "next/navigation";

const STATES = [
  { v: 2, label: "Start progress" },
  { v: 3, label: "Hold" },
  { v: 6, label: "Resolve" },
  { v: 7, label: "Close" },
  { v: 8, label: "Cancel" },
];

function SlaMeter({ sla }: { sla: any }) {
  const pct = Math.min(100, Number(sla.percentage_elapsed ?? 0));
  const breached = sla.stage === "breached" || sla.hasBreached;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{sla.sla_name}</span>
        <span className="font-ticket text-muted-foreground">
          <NumberPop value={pct.toFixed(0)} />%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={breached ? "h-full rounded-full bg-rose-500" : pct > 75 ? "h-full rounded-full bg-amber-400" : "h-full rounded-full bg-[hsl(var(--signal))]"}
          style={{ width: `${pct}%`, transition: "width var(--duration-slow) var(--ease-smooth-out)" }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {breached ? (
          <Badge variant="destructive">breached</Badge>
        ) : (
          <>stage · {sla.stage}</>
        )}
      </p>
    </div>
  );
}

export default function IncidentDetail({ params }: { params: { id: string } }) {
  const [rec, setRec] = React.useState<any>(null);
  const [confirm, setConfirm] = React.useState<number | null>(null);
  const [closeCode, setCloseCode] = React.useState("Solved (Permanently)");
  const [closeNotes, setCloseNotes] = React.useState("");
  const [resolved, setResolved] = React.useState(false);
  const toast = useToast();
  const router = useRouter();

  const load = React.useCallback(() => {
    fetch(`/api/now/table/incident/${params.id}`)
      .then((r) => r.json())
      .then((j) => setRec(j.result));
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const applyState = async (next: number, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/now/table/incident/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next, ...extra }),
      });
      if (res.ok) {
        if (next === 6) {
          setResolved(true);
          setTimeout(() => setResolved(false), 2500);
        }
        toast({ title: `Moved to ${next === 6 ? "Resolved" : next === 7 ? "Closed" : `state ${next}`}` });
        setConfirm(null);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast({ title: "Transition rejected", body: j.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message || "Failed to reach server" });
    }
  };

  return (
    <WorkspaceShell title={rec ? rec.number : "Loading record…"} tab="incident">
      <button
        onClick={() => navigateWithTransition(router, "/workspace/incident", "nav-back")}
        className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Queue
      </button>

      {!rec ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="deck-panel space-y-4 p-5">
            <div>
              {/* Shared-element target: same viewTransitionName as the queue row. */}
              <p className="font-ticket text-lg font-bold" style={{ viewTransitionName: `ticket-${rec.id}` }}>
                {rec.number}
              </p>
              <h1 className="font-display mt-1 text-2xl font-semibold leading-tight">{rec.short_description}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <PriorityBadge priority={rec.priority} />
                <StateBadge state={rec.state} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{rec.description || "No description."}</p>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-ticket text-[13px]">
              <div><dt className="text-muted-foreground">Impact</dt><dd><NumberPop value={rec.impact} /></dd></div>
              <div><dt className="text-muted-foreground">Urgency</dt><dd><NumberPop value={rec.urgency} /></dd></div>
              <div><dt className="text-muted-foreground">Category</dt><dd className="font-sans">{rec.category}</dd></div>
            </dl>

            <div className="flex flex-wrap items-center gap-2">
              {STATES.filter((s) => s.v !== rec.state && canTransition(rec.state, s.v)).map((s) => (
                <Button
                  key={s.v}
                  size="sm"
                  variant={s.v === 6 ? "signal" : "outline"}
                  onClick={() => (s.v === 7 || s.v === 8 ? setConfirm(s.v) : applyState(s.v))}
                >
                  {s.label}
                </Button>
              ))}
              <SuccessCheck show={resolved} />
            </div>

            <Accordion title="Closure & diagnostics" meta={<StateBadge state={rec.state} />}>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Close code</dt><dd>{rec.close_code || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Close notes</dt><dd className="max-w-[60%] text-right">{rec.close_notes || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Hold reason</dt><dd>{rec.hold_reason || "—"}</dd></div>
              </dl>
            </Accordion>

            <Accordion title={`SLA pressure (${(rec.slas || []).length})`} defaultOpen>
              <div className="space-y-3">
                {(rec.slas || []).map((s: any) => (
                  <SlaMeter key={s.id} sla={s} />
                ))}
                {(rec.slas || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No SLA clocks attached.</p>
                )}
              </div>
            </Accordion>
          </div>

          <ActivityFeed journals={rec.journals} taskId={params.id} table="incident" onUpdate={load} />
        </div>
      )}

      <Modal open={confirm !== null} onOpenChange={(v) => !v && setConfirm(null)}>
        <h2 className="font-display text-lg font-semibold">
          {confirm === 7 ? "Close this incident?" : "Cancel this incident?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Closure is terminal — the record becomes read-only.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Close code</span>
            <Input value={closeCode} onChange={(e) => setCloseCode(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Close notes</span>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What was done?"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>Keep open</Button>
            <Button variant={confirm === 7 ? "signal" : "destructive"} onClick={() => confirm && applyState(confirm, { close_code: closeCode, close_notes: closeNotes })}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <p className="mt-6 hidden">
        <TransitionLink href="/workspace/incident" direction="nav-back">back</TransitionLink>
      </p>
    </WorkspaceShell>
  );
}
