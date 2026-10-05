"use client";
import * as React from "react";
import { startTransition } from "react";
import { ArrowRight, Radio, Terminal, RotateCw } from "lucide-react";
import { RevealText, NumberPop, ShimmerLine } from "@/components/motion/micro";
import { TransitionLink } from "@/components/motion/nav-transition";
import { Spotlight, GridBackdrop, MovingBorderButton } from "@/components/aceternity/effects";
import { TiltCard } from "@/components/aceternity/tilt-card";
import { StateBadge, PriorityBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ROUTES = [
  { href: "/workspace/incident", kicker: "Fulfiller", title: "Incident queue", body: "Triage, hold, resolve and close with SLA pressure visible on every row." },
  { href: "/workspace/change", kicker: "Change", title: "Change control", body: "Normal, standard and emergency changes with approval state and risk." },
  { href: "/workspace/problem", kicker: "Problem", title: "Root cause", body: "Known errors, workarounds and confirmed fixes linked to incidents." },
  { href: "/catalog", kicker: "Employee", title: "Request catalog", body: "File an issue in seconds; urgency and impact set priority automatically." },
];

const PRESETS = ["priority=1^active=true", "state=3", "state=6", "category=network"];

const FLOW = [
  { state: 1, label: "New" },
  { state: 2, label: "In progress" },
  { state: 3, label: "On hold" },
  { state: 6, label: "Resolved" },
  { state: 7, label: "Closed" },
];

type Incident = {
  id: string;
  number: string;
  short_description: string;
  priority: number;
  state: number;
  active: boolean;
  category?: string;
};

function useLiveIncidents(limit = 100) {
  const [rows, setRows] = React.useState<Incident[] | null>(null);
  const refresh = React.useCallback(() => {
    fetch(`/api/now/table/incident?sysparm_limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => startTransition(() => setRows(j ? j.result || [] : null)))
      .catch(() => startTransition(() => setRows(null)));
  }, [limit]);
  React.useEffect(() => {
    refresh();
  }, [refresh]);
  return { rows, refresh };
}

/** Interactive Table API console — the page's one memorable element. */
function QueryConsole() {
  const [query, setQuery] = React.useState("priority=1^active=true");
  const [rows, setRows] = React.useState<Incident[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [total, setTotal] = React.useState<number | null>(null);
  const [denied, setDenied] = React.useState(false);

  const run = React.useCallback((q: string) => {
    setLoading(true);
    setDenied(false);
    fetch(`/api/now/table/incident?sysparm_limit=6${q ? `&sysparm_query=${encodeURIComponent(q)}` : ""}`)
      .then(async (r) => {
        if (r.status === 401) {
          startTransition(() => {
            setDenied(true);
            setRows([]);
            setTotal(null);
            setLoading(false);
          });
          return;
        }
        const j = await r.json();
        startTransition(() => {
          setRows(j.result || []);
          setTotal((j.result || []).length);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    run("priority=1^active=true");
  }, [run]);

  return (
    <section aria-label="Try the Table API" className="deck-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </span>
        <p className="flex items-center gap-1.5 font-ticket text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" /> GET /api/now/table/incident — live, against your database
        </p>
      </div>
      <form
        className="flex items-center gap-2 border-b border-border px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
      >
        <span className="font-ticket text-sm text-emerald-400" aria-hidden>$</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label="sysparm query"
          className="h-8 flex-1 bg-transparent font-ticket text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          placeholder="sysparm_query — priority=1^active=true"
        />
        <button type="submit" className="rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25">
          Run
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQuery(p);
              run(p);
            }}
            className="rounded-full border border-border px-2.5 py-1 font-ticket text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="p-4" aria-live="polite">
        {loading || rows === null ? (
          <div className="space-y-2">
            <ShimmerLine text="Querying…" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : rows.length === 0 ? (
          denied ? (
            <div className="rounded-md border border-dashed border-border p-5 text-center text-sm">
              <p className="text-muted-foreground">Live queries need a session — the engine answered 401.</p>
              <TransitionLink href="/login" className="mt-2 inline-block font-medium text-[hsl(var(--signal))] hover:underline">
                Sign in to query live data
              </TransitionLink>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Empty set — the engine answered, nothing matched. Loosen the query.
            </p>
          )
        ) : (
          <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={r.id}>
                <TransitionLink href={`/workspace/incident/${r.id}`} direction="nav-forward" className="deck-row flex items-center gap-3 rounded-md border border-border/60 px-3 py-2">
                  <span className="font-ticket text-[13px] font-bold text-[hsl(var(--signal))]">{r.number}</span>
                  <span className="line-clamp-1 flex-1 text-[13px]">{r.short_description}</span>
                  <PriorityBadge priority={r.priority} />
                  <StateBadge state={r.state} />
                </TransitionLink>
              </li>
            ))}
          </ul>
        )}
        {total !== null && !loading && (
          <p className="mt-2 font-ticket text-[11px] text-muted-foreground">
            → <NumberPop value={total} /> rows (capped at 6, sysparm_limit applies)
          </p>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { rows, refresh } = useLiveIncidents();
  const open = React.useMemo(() => rows?.filter((r) => r.active) ?? null, [rows]);
  const p1 = React.useMemo(() => open?.filter((r) => r.priority === 1).length ?? null, [open]);
  const byState = React.useMemo(() => {
    const m = new Map<number, number>();
    (rows || []).forEach((r) => m.set(r.state, (m.get(r.state) || 0) + 1));
    return m;
  }, [rows]);


  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridBackdrop />
      <div className="ac-lamp pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
        <nav className="flex items-center justify-between">
          <p className="font-ticket text-sm font-bold tracking-widest text-[hsl(var(--signal))]">
            OPENNOW
          </p>
          <div className="flex items-center gap-3 text-sm">
            <TransitionLink href="/tickets" className="text-muted-foreground hover:text-foreground">
              My tickets
            </TransitionLink>
            <TransitionLink href="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </TransitionLink>
            <MovingBorderButton>
              <TransitionLink href="/workspace/incident" direction="nav-forward">
                <span className="flex items-center gap-1.5">
                  Open the deck <ArrowRight className="h-4 w-4" />
                </span>
              </TransitionLink>
            </MovingBorderButton>
          </div>
        </nav>

        {/* Single orchestrated entrance: one staggered reveal, nothing else moves. */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
          <RevealText
            lines={[
              <strong key="a" className="font-display text-5xl font-bold leading-[1.04] md:text-6xl">
                The service desk,
                <br />
                running at signal speed.
              </strong>,
              <span key="b" className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                OpenNow is a self-hosted operations deck for incidents, changes, problems,
                SLAs and configuration items — one queue, strict state machine, millisecond
                SLA tracking. Below is not a mock: it queries your database.
              </span>,
            ]}
          />
          <div className="deck-panel flex items-center gap-6 p-4 font-ticket" aria-live="polite">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Open now</p>
              <p className="text-3xl font-bold">{open === null ? "—" : <NumberPop value={open.length} />}</p>
            </div>
            <div className="h-10 w-px bg-border" aria-hidden />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">P1 critical</p>
              <p className="text-3xl font-bold text-rose-400">{p1 === null ? "—" : <NumberPop value={p1} />}</p>
            </div>
            <button
              onClick={refresh}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="h-3.5 w-3.5" /> Resync
            </button>
          </div>
          {rows === null && (
            <p className="mt-2 text-xs text-muted-foreground">
              <TransitionLink href="/login" className="text-[hsl(var(--signal))] hover:underline">
                Sign in
              </TransitionLink>{" "}
              for live queue counts.
            </p>
          )}
        </div>

        <div className="mt-10">
          <QueryConsole />
        </div>

        {/* Deterministic state machine, with live counts from the same fetch. */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Incident lifecycle">
          {FLOW.map((s, i) => (
            <React.Fragment key={s.state}>
              <div className="deck-panel flex min-w-28 flex-1 items-center justify-between px-3 py-2.5">
                <span className="text-[13px] font-medium">{s.label}</span>
                <span className="font-ticket text-sm font-bold text-[hsl(var(--signal))]">
                  {rows === null ? "·" : <NumberPop value={byState.get(s.state) || 0} />}
                </span>
              </div>
              {i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
            </React.Fragment>
          ))}
        </div>

        <div className="signal-line mt-10" aria-hidden />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROUTES.map((r) => (
            <TiltCard key={r.href}>
              <TransitionLink href={r.href} direction="nav-forward">
                <Spotlight className="deck-panel h-full p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--signal))]">
                    {r.kicker}
                  </p>
                  <p className="font-display mt-2 text-xl font-semibold">{r.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  <p className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground">
                    Enter <ArrowRight className="h-4 w-4" />
                  </p>
                </Spotlight>
              </TransitionLink>
            </TiltCard>
          ))}
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400" /> SLA engine armed · 60s cadence
          </p>
          <p className="font-ticket">sysparm dialect · state machine · dual-stream journals</p>
        </footer>
      </div>
    </main>
  );
}
