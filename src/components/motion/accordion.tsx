"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accordion — transitions-dev `t-acc` hooks (grid-rows height, chevron flip). */
export function Accordion({
  title,
  meta,
  defaultOpen = false,
  children,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();
  return (
    <div className={cn("t-acc rounded-lg border border-border/70", className)} data-open={String(open)}>
      <button
        className="t-acc-head flex w-full items-center justify-between gap-3 p-3 text-left text-sm font-medium"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          {title}
          {meta}
        </span>
        <span className="t-acc-chevron text-muted-foreground">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6.5L8 10.5L12 6.5" />
          </svg>
        </span>
      </button>
      <div id={panelId} role="region" aria-label={typeof title === "string" ? title : undefined} className="t-acc-panel">
        <div className="t-acc-panel-inner">
          <div className="px-3 pb-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ChevronIcon({ className }: { className?: string }) {
  return <ChevronDown className={className} />;
}
