"use client";
import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, RotateCcw, CheckCheck } from "lucide-react";
import { PriorityBadge, StateBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ChatDemoTicket = {
  number: string;
  short_description: string;
  priority: number;
  state: number;
};

const USER_PROMPT = "laptop won't boot, need it for a client demo today";
const SAMPLE: ChatDemoTicket = {
  number: "INC0000420",
  short_description: "Laptop won't boot ahead of client demo",
  priority: 2,
  state: 1,
};

type Phase = "typing" | "thinking" | "streaming" | "resolving" | "done";

/**
 * Scripted "ask Otto" demo: typed request → thinking shimmer → streamed
 * triage lines → live ticket card that morphs New → In Progress, then loops.
 * Purely presentational; the ticket shown is real queue data when available.
 */
export function ChatDemo({ ticket }: { ticket?: ChatDemoTicket | null }) {
  const reduce = useReducedMotion();
  const t = ticket ?? SAMPLE;
  const [phase, setPhase] = React.useState<Phase>("typing");
  const [typed, setTyped] = React.useState("");
  const [lines, setLines] = React.useState<number>(0);
  const [resolved, setResolved] = React.useState(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const run = React.useCallback(() => {
    clear();
    if (reduce) {
      setTyped(USER_PROMPT);
      setLines(3);
      setResolved(true);
      setPhase("done");
      return;
    }
    setPhase("typing");
    setTyped("");
    setLines(0);
    setResolved(false);
    const typeMs = 26;
    for (let i = 1; i <= USER_PROMPT.length; i++) {
      later(i * typeMs, () => setTyped(USER_PROMPT.slice(0, i)));
    }
    const typedDone = USER_PROMPT.length * typeMs + 350;
    later(typedDone, () => setPhase("thinking"));
    later(typedDone + 1100, () => setPhase("streaming"));
    later(typedDone + 1100 + 500, () => setLines(1));
    later(typedDone + 1100 + 1150, () => setLines(2));
    later(typedDone + 1100 + 1800, () => {
      setLines(3);
      setPhase("resolving");
    });
    later(typedDone + 1100 + 1800 + 1500, () => {
      setResolved(true);
      setPhase("done");
    });
    later(typedDone + 1100 + 1800 + 1500 + 5200, () => runRef.current());
  }, [reduce, t.number]);

  const runRef = React.useRef(run);
  runRef.current = run;

  React.useEffect(() => {
    run();
    return clear;
  }, [run]);

  const stream = [
    `Created ${t.number} from your message — no form filled.`,
    `Priority P${t.priority} · impact × urgency scored automatically.`,
    `Routed to Service Desk · state New → acknowledged.`,
  ];

  return (
    <div className="ls-card relative overflow-hidden p-5" aria-label="Ask Otto demo">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ls-lime,#c8ff00)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--ls-ink,#0d2833)]" />
        </span>
        <p className="text-sm font-bold">Ask Otto</p>
        <span className="ml-auto font-ticket text-[11px] text-muted-foreground">demo · loops</span>
        <button
          onClick={() => runRef.current()}
          aria-label="Replay demo"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* user bubble */}
      <div className="mt-4 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--ls-ink,#0d2833)] px-3.5 py-2.5 text-sm text-white">
          {typed}
          {phase === "typing" && <span className="chat-caret" aria-hidden />}
        </div>
      </div>

      {/* assistant stream */}
      <div className="mt-3 space-y-2" aria-live="polite">
        {phase === "thinking" && (
          <p className="t-shimmer text-sm" data-text="Otto is triaging…">
            Otto is triaging…
          </p>
        )}
        {stream.slice(0, lines).map((s, i) => (
          <p key={`${t.number}-${i}`} className="stream-line rounded-xl rounded-br-md bg-[var(--ls-ink,#0d2833)] px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
            {s}
          </p>
        ))}
      </div>

      {/* live ticket card */}
      <AnimatePresence>
        {lines >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-ticket text-xs font-bold">{t.number}</span>
              <span className="flex items-center gap-1.5">
                <PriorityBadge priority={t.priority} />
                <span key={resolved ? "prog" : "new"}>
                  <StateBadge state={resolved ? 2 : 1} />
                </span>
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium">{t.short_description}</p>
            <div className={cn("mt-2 flex items-center gap-1.5 text-xs", resolved ? "text-emerald-600" : "text-muted-foreground")}>
              <CheckCheck className="h-3.5 w-3.5" />
              {resolved ? "SLA clock started · acknowledged in 41s" : "Opening record…"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
