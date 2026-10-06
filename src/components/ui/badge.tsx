import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-ticket text-[11px] font-semibold tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        destructive: "border-rose-400/40 bg-rose-500/15 text-rose-300",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        p1: "border-rose-400/40 bg-rose-500/15 text-rose-300",
        p2: "border-orange-400/40 bg-orange-500/15 text-orange-300",
        p3: "border-amber-400/30 bg-amber-400/10 text-amber-300",
        p4: "border-slate-400/30 bg-slate-400/10 text-slate-300",
        p5: "border-slate-400/20 bg-transparent text-slate-400",
        signal: "border-[#c8ff00]/40 bg-[#c8ff00]/15 text-[#c8ff00]",
        warning: "border-amber-400/40 bg-amber-400/15 text-amber-300",
        stateNew: "border-sky-400/40 bg-sky-500/15 text-sky-300",
        stateProgress: "border-indigo-400/40 bg-indigo-500/15 text-indigo-300",
        stateHold: "border-amber-400/40 bg-amber-400/15 text-amber-300",
        stateResolved: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
        stateClosed: "border-slate-400/30 bg-slate-500/10 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const STATE_BADGE: Record<number, { label: string; variant: BadgeProps["variant"] }> = {
  1: { label: "New", variant: "stateNew" },
  2: { label: "In progress", variant: "stateProgress" },
  3: { label: "On hold", variant: "stateHold" },
  6: { label: "Resolved", variant: "stateResolved" },
  7: { label: "Closed", variant: "stateClosed" },
  8: { label: "Canceled", variant: "destructive" },
};

export function StateBadge({ state }: { state: number }) {
  const s = STATE_BADGE[state] ?? { label: `State ${state}`, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: number }) {
  const v = ({ 1: "p1", 2: "p2", 3: "p3", 4: "p4", 5: "p5" } as const)[priority] ?? "p4";
  return <Badge variant={v}>P{priority}</Badge>;
}
