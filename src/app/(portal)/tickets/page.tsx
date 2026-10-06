"use client";
import * as React from "react";
import { PortalShell } from "@/components/deck/portal-shell";
import { TransitionLink } from "@/components/motion/nav-transition";
import { RevealText } from "@/components/motion/micro";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const STATE_LABEL: Record<number, string> = { 1: "New", 2: "In progress", 3: "On hold", 6: "Resolved", 7: "Closed", 8: "Canceled" };

export default function MyTicketsPage() {
  const [data, setData] = React.useState<any[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");
  React.useEffect(() => {
    fetch("/api/now/table/incident?sysparm_limit=50")
      .then((r) => r.json())
      .then((j) => setData(j.result || []))
      .catch(() => setData([]));
  }, []);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (data || []).filter(
      (t: any) =>
        !q ||
        t.number.toLowerCase().includes(q) ||
        (t.short_description || "").toLowerCase().includes(q)
    );
    return [...list].sort((a: any, b: any) =>
      sort === "newest"
        ? +new Date(b.sys_created_at) - +new Date(a.sys_created_at)
        : +new Date(a.sys_created_at) - +new Date(b.sys_created_at)
    );
  }, [data, query, sort]);


  return (
    <PortalShell title="My tickets">
      <RevealText
        lines={[
          <strong key="a" className="font-display text-2xl font-bold text-foreground">My tickets</strong>,
          <span key="b" className="mt-1 text-[15px] text-muted-foreground">Track status and follow the thread.</span>,
        ]}
      />
      <div className="deck-panel mt-5 flex flex-wrap items-center gap-2 p-2.5 pl-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets…"
          aria-label="Search tickets"
          className="h-8 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          aria-label="Sort tickets"
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {data === null ? (
          <div className="space-y-2" aria-label="Loading tickets">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">
            Nothing filed yet — the catalog is one step away.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">
            No tickets match “{query}”.
          </p>
        ) : (
          visible.map((t: any) => (
            <TransitionLink key={t.id} href={`/workspace/incident/${t.id}`} direction="nav-forward">
              <span className="block rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-[hsl(var(--signal))]">
                <span className="font-ticket text-[15px] font-bold text-foreground">{t.number}</span>
                <span className="ml-2 text-[15px] text-foreground">{t.short_description}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {STATE_LABEL[t.state] ?? t.state} · Priority P{t.priority}
                </span>
              </span>
            </TransitionLink>
          ))
        )}
      </div>
    </PortalShell>
  );
}
