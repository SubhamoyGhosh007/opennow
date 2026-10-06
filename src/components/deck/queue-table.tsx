"use client";
import * as React from "react";
import { startTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Search, X, LayoutGrid, List, Plus } from "lucide-react";
import { StateBadge, PriorityBadge } from "@/components/ui/badge";
import { NumberPop } from "@/components/motion/micro";
import { SlidingTabs } from "@/components/motion/sliding-tabs";
import { TransitionLink } from "@/components/motion/nav-transition";
import { QueueSkeletonRows } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const col = createColumnHelper<any>();

const PRESETS: Record<string, string> = {
  all: "",
  mine: "state!=7^state!=8",
  p1: "priority=1^active=true",
  breached: "",
};

/**
 * Operations queue — skeleton reveal on load, sliding filter tabs,
 * pop-in totals, shared-element ticket numbers into detail.
 */
export function QueueTable({ table, title }: { table: string; title: string }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [preset, setPreset] = React.useState("all");
  const [sort, setSort] = React.useState<"newest" | "oldest" | "priority">("newest");
  const [view, setView] = React.useState<"basic" | "detailed">("basic");

  const load = React.useCallback(
    (q: string) => {
      setLoading(true);
      fetch(`/api/now/table/${table}?sysparm_limit=50${q ? `&sysparm_query=${encodeURIComponent(q)}` : ""}`)
        .then((r) => r.json())
        .then((j) => {
          startTransition(() => {
            setData(j.result || []);
            setLoading(false);
          });
        })
        .catch(() => setLoading(false));
    },
    [table]
  );

  React.useEffect(() => {
    load(PRESETS[preset] ?? "");
  }, [table, preset, load]);

  const columns = React.useMemo(
    () => [
      col.accessor("number", {
        header: "Ticket",
        cell: (c) => (
          <TransitionLink
            href={`/workspace/${table === "change_request" ? "change" : table}/${c.row.original.id}`}
            direction="nav-forward"
            className="font-ticket text-[13px] font-semibold text-[hsl(var(--signal))] hover:underline"
          >
            <span style={{ viewTransitionName: `ticket-${c.row.original.id}` }}>
              {c.getValue() as string}
            </span>
          </TransitionLink>
        ),
      }),
      col.accessor("short_description", {
        header: "Subject",
        cell: (c) => <span className="line-clamp-1 max-w-[420px]">{c.getValue() as string}</span>,
      }),
      col.accessor("priority", {
        header: "Pri",
        cell: (c) => <PriorityBadge priority={c.getValue() as number} />,
      }),
      col.accessor("state", {
        header: "State",
        cell: (c) => <StateBadge state={c.getValue() as number} />,
      }),
      col.accessor("sys_created_at", {
        header: "Opened",
        cell: (c) => (
          <span className="font-ticket text-xs text-muted-foreground">
            {new Date(c.getValue() as string).toLocaleDateString()}
          </span>
        ),
      }),
      col.display({
        id: "description",
        header: "Detail",
        cell: (c) => (
          <span className="line-clamp-1 max-w-[320px] text-muted-foreground">{(c.row.original as any).description || "—"}</span>
        ),
      }),
    ],
    [table]
  );

  const sorted = React.useMemo(() => {
    const rows = [...data];
    if (sort === "oldest") rows.sort((a, b) => +new Date(a.sys_created_at) - +new Date(b.sys_created_at));
    else if (sort === "priority") rows.sort((a, b) => a.priority - b.priority);
    else rows.sort((a, b) => +new Date(b.sys_created_at) - +new Date(a.sys_created_at));
    return rows;
  }, [data, sort]);

  const visibleCols = React.useMemo(
    () => (view === "basic" ? columns.filter((c: any) => c.id !== "description") : columns),
    [columns, view]
  );

  const t = useReactTable({ data: sorted, columns: visibleCols as any, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SlidingTabs
          ariaLabel="Queue presets"
          value={preset}
          onChange={setPreset}
          options={[
            { value: "all", label: "All open" },
            { value: "mine", label: "Active" },
            { value: "p1", label: "P1 critical" },
          ]}
        />
        <form
          className="t-input-wrap relative ml-auto w-72"
          onSubmit={(e) => {
            e.preventDefault();
            load(query);
          }}
        >
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="sysparm_query — priority=1^active=true"
            className="t-input h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setPreset("all");
                load("");
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {loading ? (
          "Scanning…"
        ) : (
          <>
            <NumberPop value={data.length} /> records in {title}
          </>
        )}
      </p>

      {!loading && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor={`sort-${table}`}>
            Sort
          </label>
          <select
            id={`sort-${table}`}
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Highest priority</option>
          </select>
          <div className="ml-auto flex rounded-md border border-input p-0.5" role="group" aria-label="Density">
            {(
              [
                { v: "basic", label: "Basic", Icon: LayoutGrid },
                { v: "detailed", label: "Detailed", Icon: List },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => setView(o.v)}
                aria-pressed={view === o.v}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  view === o.v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <o.Icon className="h-3.5 w-3.5" /> {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <QueueSkeletonRows rows={7} />
      ) : data.length === 0 ? (
        <div className="deck-panel p-10 text-center">
          <p className="font-display text-2xl font-semibold">Queue clear</p>
          <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted-foreground">
            {query || preset !== "all"
              ? "No records match this filter. Widen the query to see the rest of the queue."
              : "Nothing here yet. File the first request and it will land in this queue."}
          </p>
          <TransitionLink
            href="/catalog"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New request
          </TransitionLink>
        </div>
      ) : (
        <div className="deck-panel overflow-hidden">
          <table className="w-full text-[15px]">
            <thead>
              {t.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-3 font-medium">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {t.getRowModel().rows.map((r) => (
                <tr key={r.id} className={cn("deck-row border-b border-border/50 last:border-0")}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="px-3 py-3">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
