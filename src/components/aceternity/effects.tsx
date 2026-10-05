"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Aceternity-style spotlight card — beam follows the pointer via --mx/--my. */
export function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("ac-spotlight", className)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}

/** Blueprint grid backdrop with top fade. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("bg-blueprint bg-blueprint-fade pointer-events-none absolute inset-0", className)} />
  );
}

/** Moving-border action button — conic border angle animates via @property. */
export function MovingBorderButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <span className={cn("ac-moving-border inline-block", className)}>
      <button
        type={type}
        onClick={onClick}
        className="flex h-9 items-center gap-2 rounded-full bg-[#0d1428] px-5 text-sm font-semibold text-slate-100 transition-colors hover:bg-[#141d3a]"
      >
        {children}
      </button>
    </span>
  );
}
