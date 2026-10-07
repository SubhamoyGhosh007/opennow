"use client";
import * as React from "react";
import { startTransition } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Eye,
  Megaphone,
  HeartHandshake,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  TicketCheck,
  Database,
  TrendingUp,
  Inbox,
  ArrowUpRight,
} from "lucide-react";
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
  const [incidents, setIncidents] = React.useState<any[] | null>(null);
  const [changes, setChanges] = React.useState<any[]>([]);
  const [problems, setProblems] = React.useState<any[]>([]);
  const [cis, setCis] = React.useState<any[]>([]);
  const [slas, setSlas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const name = session?.user?.name?.split(" ")[0] || "there";

  React.useEffect(() => {
    Promise.all([
      fetch("/api/now/table/incident?sysparm_limit=100").then((r) => r.json()).catch(() => ({ result: [] })),
      fetch("/api/now/table/change_request?sysparm_limit=100").then((r) => r.json()).catch(() => ({ result: [] })),
      fetch("/api/now/table/problem?sysparm_limit=100").then((r) => r.json()).catch(() => ({ result: [] })),
      fetch("/api/now/table/cmdb_ci?sysparm_limit=100").then((r) => r.json()).catch(() => ({ result: [] })),
      fetch("/api/now/table/task_sla?sysparm_limit=100").then((r) => r.json()).catch(() => ({ result: [] })),
    ]).then(([incRes, chgRes, prbRes, ciRes, slaRes]) => {
      startTransition(() => {
        setIncidents(incRes.result || []);
        setChanges(chgRes.result || []);
        setProblems(prbRes.result || []);
        setCis(ciRes.result || []);
        setSlas(slaRes.result || []);
        setLoading(false);
      });
    });
  }, []);

  // Compute Metrics
  const openIncidents = incidents?.filter((r) => r.active) ?? [];
  const p1Incidents = openIncidents.filter((r) => r.priority === 1).length;
  const resolvedIncidents = incidents?.filter((r) => r.state === 6 || r.state === 7).length ?? 0;

  // SLA Stats
  const breachedSlas = slas.filter((s) => s.stage === "breached").length;
  const achievedSlas = slas.filter((s) => s.stage === "achieved").length;
  const totalCompletedSlas = breachedSlas + achievedSlas;
  const slaCompliance = totalCompletedSlas > 0
    ? Math.round((achievedSlas / totalCompletedSlas) * 100)
    : 100;

  // Mean Time to Resolution (MTTR) calculation (in hours)
  const mttrHours = React.useMemo(() => {
    if (!incidents) return null;
    const resolvedItems = incidents.filter(
      (r) => (r.state === 6 || r.state === 7) && r.sys_created_at && r.sys_updated_at
    );
    if (resolvedItems.length === 0) return 1.4; // default baseline
    const totalMs = resolvedItems.reduce((acc, r) => {
      const diff = new Date(r.sys_updated_at).getTime() - new Date(r.sys_created_at).getTime();
      return acc + Math.max(0, diff);
    }, 0);
    const avgMs = totalMs / resolvedItems.length;
    return Number((avgMs / (1000 * 60 * 60)).toFixed(1));
  }, [incidents]);

  const states = [1, 2, 3, 6, 7].map((s) => ({
    s,
    n: incidents?.filter((r) => r.state === s).length ?? 0,
  }));
  const maxState = Math.max(1, ...states.map((x) => x.n));

  const cats = React.useMemo(() => {
    const m = new Map<string, number>();
    openIncidents.forEach((r) =>
      m.set(r.category || "inquiry", (m.get(r.category || "inquiry") || 0) + 1)
    );
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [openIncidents]);

  const recent = (incidents || []).slice(0, 5);

  const stats = [
    { label: "Active Incidents", sub: "open across queues", value: openIncidents.length, icon: Inbox },
    { label: "P1 Critical", sub: "urgent attention required", value: p1Incidents, icon: Megaphone, alert: p1Incidents > 0 },
    { label: "SLA Compliance", sub: `${breachedSlas} breaches recorded`, value: `${slaCompliance}%`, icon: CheckCircle2 },
    { label: "MTTR (Avg)", sub: "resolution velocity", value: `${mttrHours ?? "1.4"}h`, icon: Clock },
  ];

  return (
    <DeckShell
      title="ITSM Command Center"
      context={
        <TransitionLink
          href="/catalog"
          className="flex items-center gap-1.5 rounded-full bg-[var(--ls-lime,#c8ff00)] px-3.5 py-1.5 text-xs font-bold text-[var(--ls-ink,#0d2833)] shadow-sm hover:brightness-105 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> New request
        </TransitionLink>
      }
    >
      <WelcomeModal />
      <div className="space-y-4">
        {/* Welcome Banner - Pure Snow White with subtle soft border */}
        <div className="deck-panel bg-white/95 flex flex-wrap items-center justify-between gap-3 p-5 border-border">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {greeting()}, {name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Enterprise service operations & workload telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TransitionLink
              href="/workspace/incident"
              direction="nav-forward"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Incident queue →
            </TransitionLink>
          </div>
        </div>

        {/* Executive KPI Stats - Pure White cards with elevated micro-depth */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`deck-panel bg-white p-4 transition-all hover:border-slate-300 ${
                s.alert ? "border-rose-300 bg-rose-50/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
                <s.icon className={`h-4 w-4 ${s.alert ? "text-rose-500" : "text-muted-foreground"}`} />
              </div>
              <p className="font-ticket mt-1 text-3xl font-bold text-foreground">
                {loading ? "—" : typeof s.value === "number" ? <NumberPop value={s.value} /> : s.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Process Modules Quick Access Grid - Ghost Porcelain & Pearlescent White Tones */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TransitionLink
            href="/workspace/incident"
            className="deck-panel bg-slate-50/60 p-3.5 hover:bg-white hover:border-primary transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Inbox className="h-3.5 w-3.5 text-sky-500" /> Incidents
              </p>
              <p className="text-xl font-bold font-ticket mt-1 text-foreground">{(incidents || []).length}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </TransitionLink>

          <TransitionLink
            href="/workspace/change"
            className="deck-panel bg-indigo-50/20 p-3.5 hover:bg-white hover:border-primary transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <FolderKanban className="h-3.5 w-3.5 text-indigo-500" /> Changes
              </p>
              <p className="text-xl font-bold font-ticket mt-1 text-foreground">{changes.length}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </TransitionLink>

          <TransitionLink
            href="/workspace/problem"
            className="deck-panel bg-amber-50/20 p-3.5 hover:bg-white hover:border-primary transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <TicketCheck className="h-3.5 w-3.5 text-amber-500" /> Problems
              </p>
              <p className="text-xl font-bold font-ticket mt-1 text-foreground">{problems.length}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </TransitionLink>

          <TransitionLink
            href="/workspace/cmdb"
            className="deck-panel bg-emerald-50/20 p-3.5 hover:bg-white hover:border-primary transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Database className="h-3.5 w-3.5 text-emerald-500" /> CMDB CIs
              </p>
              <p className="text-xl font-bold font-ticket mt-1 text-foreground">{cis.length}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </TransitionLink>
        </div>

        {/* Queue Pressure Chart - Crisp White Canvas */}
        <div className="deck-panel bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--signal))]" />
                Incident Lifecycle Pressure
              </h2>
              <p className="text-xs text-muted-foreground">Distribution across lifecycle states</p>
            </div>
          </div>
          {loading ? (
            <QueueSkeletonRows rows={3} />
          ) : (incidents || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity yet — file the first ticket to light up this board.
            </p>
          ) : (
            <div className="mt-4 flex h-36 items-end gap-3" role="img" aria-label="Records by state">
              {states.map((x) => (
                <div key={x.s} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="font-ticket text-xs font-bold">
                    <NumberPop value={x.n} />
                  </span>
                  <span
                    className="w-full rounded-t-md bg-primary/80"
                    style={{
                      height: `${Math.max(6, (x.n / maxState) * 110)}px`,
                      transition: "height var(--duration-slow) var(--ease-smooth-out)",
                    }}
                  />
                  <StateBadge state={x.s} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom 3-Column Panels with Layered Alabaster & Ivory Highlights */}
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Top Categories - Ivory/White Panel */}
          <div className="deck-panel bg-white p-4">
            <h2 className="font-display text-base font-semibold">Top Demand Categories</h2>
            <p className="text-xs text-muted-foreground">Concentration of open work</p>
            <div className="mt-3 space-y-2">
              {cats.length === 0 && <p className="text-sm text-muted-foreground">No open demand.</p>}
              {cats.map(([c, n]) => (
                <div key={c} className="flex items-center gap-2 text-sm">
                  <span className="w-24 shrink-0 truncate capitalize">{c}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, n * 25)}%` }}
                    />
                  </span>
                  <span className="font-ticket text-xs font-bold">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tickets - Alabaster Row Highlights */}
          <div className="deck-panel bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">Recent Incidents</h2>
                <p className="text-xs text-muted-foreground">Latest filings across operations</p>
              </div>
              <TransitionLink href="/workspace/incident" className="text-xs font-bold text-primary hover:underline">
                View all →
              </TransitionLink>
            </div>
            <div className="mt-3 space-y-1.5">
              {recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing filed yet.</p>}
              {recent.map((r) => (
                <TransitionLink
                  key={r.id}
                  href={`/workspace/incident/${r.id}`}
                  direction="nav-forward"
                  className="deck-row flex items-center gap-2 rounded-md border border-slate-200/70 bg-slate-50/50 px-2.5 py-1.5 hover:bg-slate-100/70"
                >
                  <PriorityBadge priority={r.priority} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{r.short_description}</span>
                </TransitionLink>
              ))}
            </div>
          </div>

          {/* Assignment Groups Telemetry - Off-white Zinc Badge Rows */}
          <div className="deck-panel bg-white flex flex-col p-4">
            <h2 className="font-display text-base font-semibold">Assignment Groups</h2>
            <p className="text-xs text-muted-foreground">Active fulfiller routing queues</p>
            <div className="mt-3 space-y-1.5 text-sm">
              {[
                { name: "Service Desk", role: "Tier 1 Intake" },
                { name: "Network Tier 2", role: "Infrastructure" },
                { name: "Database Admin", role: "Data Platforms" },
                { name: "CAB Approval", role: "Change Governance" },
              ].map((g) => (
                <div key={g.name} className="flex items-center justify-between rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                  <span className="font-medium text-xs text-slate-800">{g.name}</span>
                  <span className="font-ticket text-[11px] text-muted-foreground">{g.role}</span>
                </div>
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
