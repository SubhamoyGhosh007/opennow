"use client";
import * as React from "react";
import { startTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Search, X } from "lucide-react";
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
    ],
    [table]
  );

  const t = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

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
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="sysparm_query — priority=1^active=true"
            className="t-input h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {loading ? (
        <QueueSkeletonRows rows={7} />
      ) : data.length === 0 ? (
        <div className="deck-panel p-10 text-center">
          <p className="font-display text-lg font-semibold">Queue clear</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No records match this filter. Widen the query or file a new request from the catalog.
          </p>
        </div>
      ) : (
        <div className="deck-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {t.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2.5 font-medium">
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
                    <td key={c.id} className="px-3 py-2.5">
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
