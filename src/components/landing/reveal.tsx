"use client";
import * as React from "react";
import { motion, useScroll, useReducedMotion } from "framer-motion";
import { NumberPop } from "@/components/motion/micro";
import { cn } from "@/lib/utils";

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/** Staggered text reveal — transitions-dev `t-stagger` hooks, fired on scroll. */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className={cn("t-stagger", inView && "is-shown", className)}>
      {children}
    </div>
  );
}

/**
 * Panel reveal — transitions-dev `t-panel-slide` hooks, fired on scroll.
 * delay staggers siblings (keep to ~60ms steps); y caps travel so short
 * panels still read as a full open.
 */
export function PanelReveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [inView, delay]);
  return (
    <div
      ref={ref}
      className={cn("t-panel-slide", className)}
      data-open={String(open)}
      style={{ "--panel-translate-y": `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Number pop-in that waits until scrolled into view (holds layout meanwhile). */
export function LiveNumber({ value, className }: { value: number | null; className?: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const str = value === null ? "—" : String(value);
  return (
    <span ref={ref} className={className}>
      {inView ? <NumberPop value={str} /> : str}
    </span>
  );
}

/** Thin scroll-progress signal under the nav. Skipped for reduced motion. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[var(--ls-lime-deep)]"
      style={{ scaleX: scrollYProgress }}
      aria-hidden
    />
  );
}

/**
 * Rotating word with per-letter blur flip. Grammar-safe: swap words that
 * complete the same sentence. Pauses for reduced motion.
 */
export function FlipWord({
  words = ["calm", "clear", "quiet"],
  interval = 3200,
}: {
  words?: string[];
  interval?: number;
}) {
  const [i, setI] = React.useState(0);
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [reduce, interval, words.length]);
  const w = words[i];
  return (
    <span className="inline-block" aria-live="polite">
      <span key={i} className="inline-block whitespace-nowrap">
        {w.split("").map((ch, j) => (
          <span key={j} className="flip-letter" style={{ animationDelay: `${j * 45}ms` }}>
            {ch}
          </span>
        ))}
      </span>
      <span className="sr-only"> ({words.join(", ")})</span>
    </span>
  );
}
