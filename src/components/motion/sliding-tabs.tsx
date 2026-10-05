"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sliding segmented tabs — transitions-dev `t-tabs` hooks.
 * Pill position is measured from the active tab; first paint snaps
 * without a transition (transition:none + reflow + restore).
 */
export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const barRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);

  const moveTo = React.useCallback((tab: HTMLElement | null, animate: boolean) => {
    const pill = pillRef.current;
    if (!pill || !tab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  }, []);

  React.useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const active = bar.querySelector<HTMLElement>(`[data-val="${value}"]`);
    // Snap on mount / value set from navigation; animate on clicks.
    requestAnimationFrame(() => moveTo(active, false));
  }, [value, moveTo, options.length]);

  React.useEffect(() => {
    const onResize = () => {
      const bar = barRef.current;
      const active = bar?.querySelector<HTMLElement>(`[data-val="${value}"]`);
      moveTo(active ?? null, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value, moveTo]);

  return (
    <div ref={barRef} role="tablist" aria-label={ariaLabel} className={cn("t-tabs", className)}>
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          data-val={o.value}
          aria-selected={o.value === value}
          className="t-tab text-[13px] font-medium"
          onClick={(e) => {
            onChange(o.value);
            moveTo(e.currentTarget, true);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
