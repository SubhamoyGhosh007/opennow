"use client";
import * as React from "react";
import { startTransition } from "react";
import { useSession } from "next-auth/react";
import { Plus, Eye, Megaphone, HeartHandshake } from "lucide-react";
import { DeckShell } from "@/components/deck/deck-shell";
import { WelcomeModal } from "@/components/deck/welcome-modal";
import { StateBadge, PriorityBadge } from "@/components/ui/badge";
import { NumberPop } from "@/components/motion/micro";
import { TransitionLink } from "@/components/motion/nav-transition";
import { QueueSkeletonRows } from "@/components/ui/skeleton";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const { data: session } = useSession();
  const [rows, setRows] = React.useState<any[] | null>(null);
  const [breached, setBreached] = React.useState<number | null>(null);
  const name = session?.user?.name?.split(" ")[0] || "there";

  React.useEffect(() => {
    fetch("/api/now/table/incident?sysparm_limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => startTransition(() => setRows(j ? j.result || [] : [])))
      .catch(() => setRows([]));
    fetch("/api/now/table/task_sla?sysparm_query=stage=breached&sysparm_limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setBreached(j ? (j.result || []).length : 0))
      .catch(() => setBreached(0));
  }, []);

  const open = rows?.filter((r) => r.active) ?? null;
  const p1 = open?.filter((r) => r.priority === 1).length ?? null;
  const resolved = rows?.filter((r) => r.state === 6 || r.state === 7).length ?? null;
  const states = [1, 2, 3, 6, 7].map((s) => ({ s, n: rows?.filter((r) => r.state === s).length ?? 0 }));
  const max = Math.max(1, ...states.map((x) => x.n));
  const cats = React.useMemo(() => {
    const m = new Map<string, number>();
    (rows || []).filter((r) => r.active).forEach((r) => m.set(r.category || "inquiry", (m.get(r.category || "inquiry") || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [rows]);
  const recent = (rows || []).slice(0, 5);

  const stats = [
    { label: "Open now", sub: "across all queues", value: open?.length ?? null, icon: Eye },
    { label: "P1 critical", sub: "needs eyes first", value: p1, icon: Megaphone },
    { label: "Resolved", sub: "sealed read-only", value: resolved, icon: HeartHandshake },
    { label: "SLA breached", sub: "clocks over target", value: breached, icon: Plus },
  ];

  return (
    <DeckShell
      title="Overview"
      context={
        <TransitionLink
          href="/catalog"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New incident
        </TransitionLink>
      }
    >
      <WelcomeModal />
      <div className="space-y-4">
        <div className="deck-panel flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {greeting()}, {name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s your queue today.</p>
          </div>
          <TransitionLink href="/workspace/incident" direction="nav-forward" className="text-sm font-semibold text-primary hover:underline">
            Open the full queue →
          </TransitionLink>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="deck-panel p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="font-ticket mt-1 text-3xl font-bold">
                {s.value === null ? "—" : <NumberPop value={s.value} />}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="deck-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Queue pressure</h2>
              <p className="text-xs text-muted-foreground">Records by state, right now</p>
            </div>
          </div>
          {rows === null ? (
            <QueueSkeletonRows rows={3} />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet — file the first ticket to light up this board.</p>
          ) : (
            <div className="mt-4 flex h-36 items-end gap-3" role="img" aria-label="Records by state">
              {states.map((x) => (
                <div key={x.s} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="font-ticket text-xs font-bold"><NumberPop value={x.n} /></span>
                  <span
                    className="w-full rounded-t-md bg-primary/70"
                    style={{ height: `${Math.max(6, (x.n / max) * 110)}px`, transition: "height var(--duration-slow) var(--ease-smooth-out)" }}
                  />
                  <StateBadge state={x.s} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="deck-panel p-4">
            <h2 className="font-display text-base font-semibold">Top categories</h2>
            <p className="text-xs text-muted-foreground">Where open demand concentrates</p>
            <div className="mt-3 space-y-2">
              {cats.length === 0 && <p className="text-sm text-muted-foreground">No open demand.</p>}
              {cats.map(([c, n]) => (
                <div key={c} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 truncate capitalize">{c}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, n * 25)}%` }} />
                  </span>
                  <span className="font-ticket text-xs font-bold">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="deck-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">Recent tickets</h2>
                <p className="text-xs text-muted-foreground">Latest across the queue</p>
              </div>
              <TransitionLink href="/workspace/incident" className="text-xs font-bold text-primary hover:underline">
                View all →
              </TransitionLink>
            </div>
            <div className="mt-3 space-y-1.5">
              {recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing filed yet.</p>}
              {recent.map((r) => (
                <TransitionLink key={r.id} href={`/workspace/incident/${r.id}`} direction="nav-forward" className="deck-row flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5">
                  <PriorityBadge priority={r.priority} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{r.short_description}</span>
                </TransitionLink>
              ))}
            </div>
          </div>
          <div className="deck-panel flex flex-col p-4">
            <h2 className="font-display text-base font-semibold">Assignment groups</h2>
            <p className="text-xs text-muted-foreground">Who owns the work</p>
            <div className="mt-3 space-y-1.5 text-sm">
              {["Service Desk", "Network Tier 2", "Database Admin"].map((g) => (
                <p key={g} className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5">
                  {g}
                  <span className="font-ticket text-xs text-muted-foreground">armed</span>
                </p>
              ))}
            </div>
            <TransitionLink href="/settings" className="mt-auto pt-3 text-xs font-bold text-primary hover:underline">
              Manage team & access →
            </TransitionLink>
          </div>
        </div>
      </div>
    </DeckShell>
  );
}
