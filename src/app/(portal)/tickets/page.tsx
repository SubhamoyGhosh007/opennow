"use client";
import * as React from "react";
import { PortalShell } from "@/components/deck/portal-shell";
import { TransitionLink } from "@/components/motion/nav-transition";
import { RevealText } from "@/components/motion/micro";
import { Skeleton } from "@/components/ui/skeleton";

const STATE_LABEL: Record<number, string> = { 1: "New", 2: "In progress", 3: "On hold", 6: "Resolved", 7: "Closed", 8: "Canceled" };

export default function MyTicketsPage() {
  const [data, setData] = React.useState<any[] | null>(null);
  React.useEffect(() => {
    fetch("/api/now/table/incident?sysparm_limit=50")
      .then((r) => r.json())
      .then((j) => setData(j.result || []))
      .catch(() => setData([]));
  }, []);


  return (
    <PortalShell title="My tickets">
      <RevealText
        lines={[
          <strong key="a" className="font-display text-2xl font-bold text-slate-900">My tickets</strong>,
          <span key="b" className="mt-1 text-sm text-slate-500">Track status and follow the thread.</span>,
        ]}
      />
      <div className="mt-5 space-y-2">
        {data === null ? (
          <div className="space-y-2" aria-label="Loading tickets">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <Skeleton className="h-4 w-2/3 bg-slate-200" />
                <Skeleton className="mt-2 h-3 w-1/3 bg-slate-200" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Nothing filed yet — the catalog is one step away.
          </p>
        ) : (
          data.map((t: any) => (
            <TransitionLink key={t.id} href={`/workspace/incident/${t.id}`} direction="nav-forward">
              <span className="block rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-[hsl(var(--signal))]">
                <span className="font-ticket text-sm font-bold text-slate-900">{t.number}</span>
                <span className="ml-2 text-sm text-slate-700">{t.short_description}</span>
                <span className="mt-1 block text-xs text-slate-500">
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
