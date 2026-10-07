"use client";
import * as React from "react";
import { TransitionLink } from "@/components/motion/nav-transition";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, TicketCheck, Search, ShieldCheck } from "lucide-react";

const STEPS = [
  { icon: TicketCheck, title: "File your first ticket", body: "The catalog takes under a minute — priority sets itself.", href: "/catalog", cta: "Open catalog" },
  { icon: Search, title: "Work the live queue", body: "Filter with sysparm, sort, and drill into any record.", href: "/workspace/incident", cta: "Open queue" },
  { icon: ShieldCheck, title: "Trust the machine", body: "Illegal jumps bounce with 422s; holds pause SLA clocks.", href: "/workspace/incident", cta: "See a record" },
];

/** First-visit walkthrough: 3 real steps + dismiss-forever. */
export function WelcomeModal() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    try {
      if (!localStorage.getItem("opennow-welcomed")) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  const dismiss = (forever: boolean) => {
    try {
      if (forever) localStorage.setItem("opennow-welcomed", "1");
    } catch {}
    setOpen(false);
  };
  return (
    <Modal open={open} onOpenChange={(v) => !v && dismiss(false)}>
      <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Rocket className="h-5 w-5" />
      </div>
      <h2 className="font-display text-xl font-bold">Let&apos;s get you set up</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Three steps and the deck is yours. Stop anytime — this takes about a minute.
      </p>
      <ol className="mt-4 space-y-2">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="font-ticket flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{s.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.body}</span>
            </span>
            <TransitionLink
              href={s.href}
              direction="nav-forward"
              className="shrink-0 text-xs font-bold text-primary hover:underline"
            >
              {s.cta}
            </TransitionLink>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => dismiss(true)} className="order-2 py-2 text-center text-xs text-muted-foreground hover:text-foreground sm:order-1 sm:py-0 sm:text-left">
          Don&apos;t show this again
        </button>
        <Button onClick={() => dismiss(false)} className="order-1 w-full sm:order-2 sm:w-auto">Show me around</Button>
      </div>
    </Modal>
  );
}
