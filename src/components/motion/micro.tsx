"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Number pop-in — transitions-dev `t-digit-group` hooks. Last two digits stagger. */
export function NumberPop({ value, className }: { value: string | number; className?: string }) {
  const str = String(value);
  const [key, setKey] = React.useState(0);
  React.useEffect(() => {
    setKey((k) => k + 1);
  }, [str]);
  return (
    <span key={key} className={cn("t-digit-group is-animating font-ticket", className)} aria-label={str}>
      {str.split("").map((ch, i) => (
        <span
          key={i}
          className="t-digit"
          data-stagger={i === str.length - 2 ? "1" : i === str.length - 1 ? "2" : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

/** Staggered hero/empty-state reveal — transitions-dev `t-stagger` hooks. */
export function RevealText({
  lines,
  className,
}: {
  lines: [React.ReactNode, React.ReactNode?, React.ReactNode?, React.ReactNode?];
  className?: string;
}) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  return (
    <div className={cn("t-stagger", shown && "is-shown", className)}>
      {lines.map((l, i) =>
        l ? (
          <span key={i} className={`t-stagger-line t-stagger-line--${i + 1}`}>
            {l}
          </span>
        ) : null
      )}
    </div>
  );
}

/** Success check — transitions-dev `t-success-check` hooks. */
export function SuccessCheck({ show, className }: { show: boolean; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (show) {
      el.setAttribute("data-state", "out");
      void el.offsetWidth;
      el.setAttribute("data-state", "in");
    } else {
      el.setAttribute("data-state", "out");
    }
  }, [show]);
  return (
    <span ref={ref} className={cn("t-success-check", className)} data-state="out" aria-hidden={!show}>
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10">
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2.5" opacity="0.35" />
        <path d="M15 24.5L21.5 31L33 18.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Shimmer status line — transitions-dev `t-shimmer` hooks (pure CSS). */
export function ShimmerLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("t-shimmer text-sm", className)} data-text={text}>
      {text}
    </span>
  );
}
