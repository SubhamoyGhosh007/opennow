"use client";
import * as React from "react";
import { ShimmerLine } from "@/components/motion/micro";

/** Status strip — persistent chrome, isolated from page transitions. */
export function StatusStrip({ title, context }: { title: string; context?: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <header
      style={{ viewTransitionName: "site-chrome" }}
      className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold leading-tight">{title}</p>
          {loading ? (
            <ShimmerLine text="Syncing queue…" />
          ) : (
            <p className="text-xs text-muted-foreground">Live · SLA engine armed</p>
          )}
        </div>
        <div className="flex items-center gap-3">{context}</div>
      </div>
    </header>
  );
}
