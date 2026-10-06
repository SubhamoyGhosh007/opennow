"use client";
import * as React from "react";
import { useToast } from "@/components/motion/toast";
import { Button } from "@/components/ui/button";

/**
 * Dual-stream activity feed — work notes (amber, fulfiller-only) vs
 * customer comments. Posts slide in via panel reveal; toast confirms.
 */
export function ActivityFeed({
  journals,
  taskId,
  table,
  onUpdate,
}: {
  journals: any[];
  taskId: string;
  table: string;
  onUpdate: () => void;
}) {
  const [text, setText] = React.useState("");
  const [kind, setKind] = React.useState<"comments" | "work_notes">("comments");
  const [posting, setPosting] = React.useState(false);
  const toast = useToast();

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/now/table/${table}/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [kind]: text }),
      });
      setPosting(false);
      if (res.ok) {
        setText("");
        toast({ title: kind === "work_notes" ? "Work note logged" : "Reply posted" });
        onUpdate();
      } else {
        const j = await res.json().catch(() => ({}));
        toast({ title: "Could not post", body: j.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      setPosting(false);
      toast({ title: "Network error", body: e.message || "Failed to reach server" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="t-tabs self-start" role="tablist" aria-label="Journal stream">
        {(["comments", "work_notes"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            className="t-tab text-[13px] font-medium"
            onClick={() => setKind(k)}
          >
            {k === "comments" ? "Comments" : "Work notes"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(journals || []).map((j: any) => (
          <article
            key={j.id}
            className={j.element === "work_notes" ? "note-internal p-3" : "note-public p-3"}
          >
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
              {j.element === "work_notes" ? "Work notes · internal" : "Customer comments"}
            </p>
            <p className="text-[15px] leading-relaxed">{j.value}</p>
            <p className="mt-1 font-ticket text-[11px] opacity-60">
              {new Date(j.sys_created_at).toLocaleString()}
            </p>
          </article>
        ))}
        {(!journals || journals.length === 0) && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-[15px] text-muted-foreground">
            No activity yet — open the thread below.
          </p>
        )}
      </div>

      <div className="deck-panel t-panel-slide space-y-2 p-3" data-open="true" style={{ ["--panel-translate-y" as string]: "24px" }}>
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-transparent p-2 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={kind === "work_notes" ? "Internal fulfiller note" : "Customer reply"}
          placeholder={kind === "work_notes" ? "Internal fulfiller note…" : "Reply to the requester…"}
        />
        <div className="flex justify-end">
          <Button size="sm" variant="default" onClick={post} disabled={posting || !text.trim()}>
            {posting ? "Posting…" : kind === "work_notes" ? "Log work note" : "Post reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
