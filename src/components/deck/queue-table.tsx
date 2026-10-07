"use client";
import * as React from "react";
import { startTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { EmptyArt } from "@/components/deck/empty-art";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/motion/toast";
import { cn } from "@/lib/utils";

const col = createColumnHelper<any>();

/** Pop-in wrapper so priority/state pills morph when their value changes. */
function BadgePop({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.span
      className="inline-flex"
      initial={{ scale: 0.85, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}

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
function QueueRows({ rows }: { rows: any[] }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <>
        {rows.map((r) => (
          <tr key={r.original.id} className={cn("deck-row border-b border-border/50 last:border-0")}>
            {r.getVisibleCells().map((c: any) => (
              <td key={c.id} className="px-3 py-3">
                {flexRender(c.column.columnDef.cell, c.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
  return (
    <AnimatePresence initial={false}>
      {rows.map((r) => (
        <motion.tr
          key={r.original.id}
          layout
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn("deck-row border-b border-border/50 last:border-0")}
        >
          {r.getVisibleCells().map((c: any) => (
            <td key={c.id} className="px-3 py-3">
              {flexRender(c.column.columnDef.cell, c.getContext())}
            </td>
          ))}
        </motion.tr>
      ))}
    </AnimatePresence>
  );
}

export function QueueTable({ table, title }: { table: string; title: string }) {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [preset, setPreset] = React.useState("all");
  const [sort, setSort] = React.useState<"newest" | "oldest" | "priority">("newest");
  const [view, setView] = React.useState<"basic" | "detailed">("basic");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    short_description: "",
    description: "",
    urgency: 3,
    impact: 3,
    category: "inquiry",
    type: "normal",
    risk: 3,
    implementation_plan: "",
    workaround: "",
    root_cause: "",
    known_error: false,
  });
  const toast = useToast();

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
        cell: (c) => <BadgePop key={`p-${c.getValue()}`}><PriorityBadge priority={c.getValue() as number} /></BadgePop>,
      }),
      col.accessor("state", {
        header: "State",
        cell: (c) => <BadgePop key={`s-${c.getValue()}`}><StateBadge state={c.getValue() as number} /></BadgePop>,
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.short_description.trim()) {
      toast({ title: "Validation error", body: "Short description is required" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/now/table/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const j = await res.json();
        const num = j.result?.number || "Record";
        toast({ title: `${num} created`, body: "Added to queue successfully" });
        setCreateOpen(false);
        setForm({
          short_description: "",
          description: "",
          urgency: 3,
          impact: 3,
          category: "inquiry",
          type: "normal",
          risk: 3,
          implementation_plan: "",
          workaround: "",
          root_cause: "",
          known_error: false,
        });
        load(PRESETS[preset] ?? "");
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Failed to create", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message || "Failed to reach server" });
    } finally {
      setSubmitting(false);
    }
  };

  const getRecordLabel = () => {
    if (table === "incident") return "Incident";
    if (table === "change_request") return "Change";
    if (table === "problem") return "Problem";
    return "Record";
  };

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
        <div className="ml-auto flex items-center gap-2">
          <form
            className="t-input-wrap relative w-72"
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
          <Button
            size="sm"
            variant="signal"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 btn-glow"
          >
            <Plus className="h-4 w-4" />
            New {getRecordLabel()}
          </Button>
        </div>
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
          <EmptyArt kind={query || preset !== "all" ? "search" : "inbox"} className="mx-auto" />
          <p className="font-display mt-4 text-2xl font-semibold">Queue clear</p>
          <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted-foreground">
            {query || preset !== "all"
              ? "No records match this filter. Widen the query to see the rest of the queue."
              : "Nothing here yet. File the first request and it will land in this queue."}
          </p>
          <TransitionLink
            href="/catalog"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 btn-glow"
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
              <QueueRows rows={t.getRowModel().rows} />
            </tbody>
          </table>
        </div>
      )}

      {/* Record Creation Modal */}
      <Modal open={createOpen} onOpenChange={(v) => setCreateOpen(v)}>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold">Create New {getRecordLabel()}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Fill in the attributes below to log a new ticket into the system.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Short Description *
            </label>
            <Input
              required
              placeholder={`Summary of this ${getRecordLabel().toLowerCase()}...`}
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              placeholder="Additional background, reproduction steps, or context..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Urgency
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: Number(e.target.value) })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={1}>1 - High</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Impact
              </label>
              <select
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={1}>1 - High</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Low</option>
              </select>
            </div>
          </div>

          {/* Table Specific Fields */}
          {table === "incident" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="inquiry">Inquiry / Help</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="network">Network</option>
                <option value="database">Database</option>
              </select>
            </div>
          )}

          {table === "change_request" && (
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Change Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="normal">Normal (CAB Review)</option>
                    <option value="standard">Standard (Pre-Approved)</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Risk Level
                  </label>
                  <select
                    value={form.risk}
                    onChange={(e) => setForm({ ...form, risk: Number(e.target.value) })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={1}>High Risk</option>
                    <option value={2}>Medium Risk</option>
                    <option value={3}>Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Implementation Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline deployment steps, commands, or release sequence..."
                  value={form.implementation_plan}
                  onChange={(e) => setForm({ ...form, implementation_plan: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {table === "problem" && (
            <div className="space-y-3 border-t pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={form.known_error}
                  onChange={(e) => setForm({ ...form, known_error: e.target.checked })}
                  className="rounded border-input text-[hsl(var(--signal))] focus:ring-[hsl(var(--signal))]"
                />
                Flag as Known Error
              </label>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Workaround (Interim Mitigation)
                </label>
                <textarea
                  rows={2}
                  placeholder="Document interim workaround for agents..."
                  value={form.workaround}
                  onChange={(e) => setForm({ ...form, workaround: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={2}
                  placeholder="Suspected or confirmed root cause..."
                  value={form.root_cause}
                  onChange={(e) => setForm({ ...form, root_cause: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="signal" disabled={submitting}>
              {submitting ? "Creating..." : `Create ${getRecordLabel()}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
