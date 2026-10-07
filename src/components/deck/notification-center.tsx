"use client";
import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, AlertTriangle, Flame, X, CheckCheck } from "lucide-react";
import { TransitionLink } from "@/components/motion/nav-transition";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  kind: "breach" | "p1";
  title: string;
  body: string;
  at: number;
  href: string;
};

const READ_KEY = "opennow:notif-read-at";

function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/**
 * Notification bell + slide-over drawer. Surfaces SLA breaches and fresh
 * P1 filings; read state persists in localStorage.
 */
export function NotificationCenter() {
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[] | null>(null);
  const [readAt, setReadAt] = React.useState<number>(() => {
    try {
      return Number(localStorage.getItem(READ_KEY)) || 0;
    } catch {
      return 0;
    }
  });
  const reduce = useReducedMotion();

  const load = React.useCallback(async () => {
    try {
      const [slaRes, p1Res] = await Promise.all([
        fetch("/api/now/table/task_sla?sysparm_limit=20").then((r) => (r.ok ? r.json() : { result: [] })).catch(() => ({ result: [] })),
        fetch("/api/now/table/incident?sysparm_query=priority=1&sysparm_limit=20").then((r) => (r.ok ? r.json() : { result: [] })).catch(() => ({ result: [] })),
      ]);
      const items: Note[] = [
        ...(slaRes.result || [])
          .filter((s: any) => s.stage === "breached")
          .map((s: any) => ({
            id: `sla-${s.id}`,
            kind: "breach" as const,
            title: "SLA breached",
            body: `Clock over target on ${s.task_number || "a linked record"}`,
            at: s.sys_updated_at ? +new Date(s.sys_updated_at) : Date.now(),
            href: "/workspace/incident",
          })),
        ...(p1Res.result || []).map((t: any) => ({
          id: `p1-${t.id}`,
          kind: "p1" as const,
          title: `${t.number} needs eyes`,
          body: t.short_description || "Priority 1 filed",
          at: t.sys_created_at ? +new Date(t.sys_created_at) : Date.now(),
          href: `/workspace/incident/${t.id}`,
        })),
      ];
      items.sort((a, b) => b.at - a.at);
      setNotes(items.slice(0, 8));
    } catch {
      setNotes([]);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Seed the read watermark on first sight so history doesn't all glow unread.
  React.useEffect(() => {
    if (notes === null) return;
    try {
      if (!localStorage.getItem(READ_KEY)) {
        const now = Date.now();
        localStorage.setItem(READ_KEY, String(now));
        setReadAt(now);
      }
    } catch {
      /* ignore */
    }
  }, [notes]);

  const unread = (notes || []).filter((n) => n.at > readAt).length;

  const markRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem(READ_KEY, String(now));
    } catch {
      /* ignore */
    }
    setReadAt(now);
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          load();
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        title="Notifications"
        className="relative rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ls-lime,#c8ff00)] px-1 font-ticket text-[10px] font-bold text-[var(--ls-ink,#0d2833)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
              aria-hidden
            />
            <motion.aside
              role="dialog"
              aria-label="Notifications"
              initial={{ x: 340, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 36 }}
              className="fixed right-3 top-3 z-[95] flex max-h-[calc(100vh-1.5rem)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="font-display text-[15px] font-bold">Activity</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={markRead}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
                {notes === null && (
                  <p className="px-2 py-8 text-center text-sm text-muted-foreground">Listening for breaches and P1s…</p>
                )}
                {notes !== null && notes.length === 0 && (
                  <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                    All quiet — no breaches, no fresh P1s.
                  </p>
                )}
                {(notes || []).map((n) => {
                  const fresh = n.at > readAt;
                  return (
                    <TransitionLink
                      key={n.id}
                      href={n.href}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                        fresh ? "border-border bg-accent/50" : "border-transparent hover:bg-accent/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          n.kind === "breach" ? "bg-rose-500/15 text-rose-500" : "bg-[var(--ls-lime,#c8ff00)]/20 text-foreground"
                        )}
                      >
                        {n.kind === "breach" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span className="truncate">{n.title}</span>
                          {fresh && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ls-lime,#c8ff00)] ring-2 ring-[var(--ls-lime,#c8ff00)]/30" aria-label="Unread" />}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                        <span className="font-ticket text-[11px] text-muted-foreground">{timeAgo(n.at)}</span>
                      </span>
                    </TransitionLink>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
