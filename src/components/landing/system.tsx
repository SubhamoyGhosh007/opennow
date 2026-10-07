"use client";
import * as React from "react";
import { startTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Check,
  Minus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock3,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { TransitionLink } from "@/components/motion/nav-transition";
import { useSession } from "next-auth/react";
import { Accordion } from "@/components/motion/accordion";
import { SuccessCheck, ShimmerLine } from "@/components/motion/micro";
import { SlidingTabs } from "@/components/motion/sliding-tabs";
import { Reveal, PanelReveal, LiveNumber, FlipWord } from "@/components/landing/reveal";
import { ChatDemo } from "@/components/landing/chat-demo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export type Row = {
  id: string;
  number: string;
  short_description: string;
  priority: number;
  state: number;
  active: boolean;
  close_code?: string | null;
  sys_created_at?: string;
};

export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const STATE_LABEL: Record<number, string> = { 1: "New", 2: "In progress", 3: "On hold", 6: "Resolved", 7: "Closed", 8: "Canceled" };

function useLiveRows(limit = 100) {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  React.useEffect(() => {
    fetch(`/api/now/table/incident?sysparm_limit=${limit}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => startTransition(() => setRows(j ? j.result || [] : null)))
      .catch(() => startTransition(() => setRows(null)));
  }, [limit]);
  return rows;
}

export function useLandingRows() {
  return useLiveRows(100);
}

export function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith("#")) {
    e.preventDefault();
    const id = href.replace("#", "");
    if (id === "top" || !id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", window.location.pathname);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", href);
    }
  }
}

/* 1 — Sticky navigation */
export function SysNav() {
  const [open, setOpen] = React.useState(false);
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#engines", label: "Engines" },
    { href: "#metrics", label: "Results" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ls-line)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <a
          href="#top"
          onClick={(e) => scrollToSection(e, "#top")}
          className="flex items-center gap-2 cursor-pointer"
          aria-label="OpenNow home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--ls-ink)] font-ticket text-[11px] font-bold text-[var(--ls-lime)]">
            ON
          </span>
          <span className="font-display text-lg font-bold tracking-tight">OpenNow</span>
        </a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Product">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => scrollToSection(e, l.href)}
              className="sysnav-link text-[15px] font-medium text-[var(--ls-muted)] hover:text-[var(--ls-ink)] cursor-pointer transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle className="h-9 w-9 rounded-full border border-[var(--ls-line)]" />
          {!signedIn && (
            <TransitionLink href="/login" className="hidden text-[15px] font-medium sm:inline">
              Log in
            </TransitionLink>
          )}
          <TransitionLink href="/workspace/incident" direction="nav-forward" className="ls-btn !px-5 !py-3 !text-[15px]">
            Open the deck
          </TransitionLink>
          <button
            className="rounded-md p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="block h-0.5 w-5 bg-[var(--ls-ink)]" />
            <span className="mt-1 block h-0.5 w-5 bg-[var(--ls-ink)]" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[var(--ls-line)] px-4 py-3 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                setOpen(false);
                scrollToSection(e, l.href);
              }}
              className="block rounded-md px-2 py-2 text-[15px] font-medium cursor-pointer hover:bg-[var(--ls-mist)] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

/* 2 — Hero audit section */
type Mode = "queue" | "p1" | "settled";

export function Hero({ rows }: { rows: Row[] | null }) {
  const [mode, setMode] = React.useState<Mode>("queue");
  const [filter, setFilter] = React.useState("");
  const [applied, setApplied] = React.useState("");

  const candidates = React.useMemo(() => {
    let list = rows || [];
    if (mode === "p1") list = list.filter((r) => r.priority === 1 && r.active);
    if (mode === "settled") list = list.filter((r) => r.state === 6 || r.state === 7);
    if (applied) {
      const q = applied.toLowerCase();
      list = list.filter(
        (r) => r.number.toLowerCase().includes(q) || r.short_description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, mode, applied]);

  const demoTicket = React.useMemo(() => {
    const pick = candidates[0];
    if (!pick) return null;
    return {
      number: pick.number,
      short_description: pick.short_description,
      priority: pick.priority,
      state: pick.state,
    };
  }, [candidates]);

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
      <div>
        <span className="ls-eyebrow-lime">Self-hosted ITSM</span>
        <h1 className="font-display mt-4 text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
          <span className="whip-mask">
            <span className="whip-line">The <FlipWord /> queue</span>
          </span>
          <span className="whip-mask">
            <span className="whip-line" style={{ animationDelay: "90ms" }}>for noisy infrastructure.</span>
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--ls-muted)] md:text-lg">
          OpenNow runs your incidents, changes and problems on your own database —
          one queue, a strict state machine, and an SLA engine that never blinks.
        </p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Queue view">
          {(["queue", "p1", "settled"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "rounded-full border px-4 py-2 text-[15px] font-semibold transition-colors",
                mode === m
                  ? "border-[var(--ls-ink)] bg-[var(--ls-ink)] text-white"
                  : "border-[var(--ls-line)] text-[var(--ls-muted)] hover:text-[var(--ls-ink)]"
              )}
            >
              {m === "queue" ? "Open queue" : m === "p1" ? "P1 watch" : "Settled"}
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex max-w-md items-center gap-2 rounded-full border border-[var(--ls-line)] bg-white p-1.5 pl-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(filter);
          }}
        >
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Try a ticket number or word…"
            aria-label="Filter the live queue preview"
            className="h-9 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--ls-muted)]"
          />
          <button type="submit" className="ls-btn !py-3">
            Search
          </button>
        </form>
        <p className="mt-3 text-[13px] text-[var(--ls-muted)]">
          Demo reads your local database. Nothing leaves this machine.
        </p>
      </div>

      <div className="relative">
        <div className="ls-blob absolute -inset-6 rounded-[24px]" aria-hidden />
        <div className="relative">
          <ChatDemo ticket={demoTicket} />
        </div>
        <div className="float-med absolute -bottom-6 -left-2 hidden w-60 rounded-2xl border border-[var(--ls-line)] bg-white p-4 shadow-[0_24px_64px_-24px_rgba(13,40,51,0.35)] md:block">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--ls-muted)]">SLA heartbeat</p>
          <p className="font-display mt-1 text-3xl font-bold">60s</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ls-muted)]">
            <Clock3 className="h-3 w-3" /> breach sweep, around the clock
          </p>
        </div>
      </div>
    </section>
  );
}

/* 3 — Customer logo marquee (duplicated track loops seamlessly, pauses on hover) */
const LOGOS = ["NORTHLOOP", "helix", "Vantage&Co", "KODA", "Brightline", "osmo"];
const LOGO_STYLE = [
  { fontWeight: 700, letterSpacing: "0.2em" },
  { fontWeight: 400, letterSpacing: "0" },
  { fontWeight: 600, letterSpacing: "0" },
  { fontWeight: 800, letterSpacing: "0.3em" },
  { fontWeight: 500, letterSpacing: "0.05em" },
  { fontWeight: 700, letterSpacing: "-0.02em" },
];
export function LogoStrip() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <section className="border-y border-[var(--ls-line)]" aria-label="Customer logos">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <p className="ls-eyebrow text-center">Trusted by lean IT teams</p>
        <div className="marquee mt-5">
          <div className="marquee-track items-center gap-14 pr-14" aria-hidden={false}>
            {doubled.map((l, i) => (
              <span
                key={`${l}-${i}`}
                aria-hidden={i >= LOGOS.length}
                className="shrink-0 whitespace-nowrap text-[var(--ls-muted)]"
                style={{ ...LOGO_STYLE[i % LOGOS.length], fontSize: 15, opacity: 0.75 }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3b — Scroll-linked story: sticky visual morphs through File → Triage → Resolve */
const STORY_STEPS = [
  {
    id: "file",
    n: "01",
    title: "File in seconds",
    body: "Anyone describes the problem in plain words. Impact × urgency scores the priority — no triage meeting, no form fatigue.",
  },
  {
    id: "triage",
    n: "02",
    title: "Triage itself",
    body: "P1 floats to the top, holds pause the SLA clock, and work notes stay internal while replies stay kind.",
  },
  {
    id: "resolve",
    n: "03",
    title: "Resolve with proof",
    body: "Close with a code and notes. The record seals read-only and the lifecycle strip tells the whole story.",
  },
] as const;

function StoryScene({ id }: { id: (typeof STORY_STEPS)[number]["id"] }) {
  if (id === "file") {
    return (
      <div className="ls-card p-5">
        <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">NEW REQUEST</p>
        <div className="mt-3 space-y-2.5">
          <div className="rounded-xl border border-[var(--ls-line)] px-3 py-2.5 text-sm font-medium">
            Laptop won&apos;t boot ahead of demo…
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-[var(--ls-ink)] px-3 py-1 text-xs font-bold text-white">Urgency · High</span>
            <span className="rounded-full bg-[var(--ls-ink)] px-3 py-1 text-xs font-bold text-white">Impact · High</span>
          </div>
          <div className="rounded-full bg-[var(--ls-lime,#c8ff00)] px-4 py-2.5 text-center text-sm font-bold text-[var(--ls-ink,#0d2833)]">
            File as P1 →
          </div>
        </div>
      </div>
    );
  }
  if (id === "triage") {
    return (
      <div className="ls-card p-5">
        <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">LIVE QUEUE</p>
        <div className="mt-3 space-y-2">
          {[
            { n: "INC0000420", s: "Laptop won't boot", p: 1, st: "In Progress" },
            { n: "INC0000419", s: "VPN drops on night shift", p: 2, st: "In Progress" },
            { n: "INC0000418", s: "Printer jam, floor 3", p: 4, st: "On Hold" },
          ].map((r) => (
            <div key={r.n} className="flex items-center gap-2.5 rounded-xl border border-[var(--ls-line)] px-3 py-2.5">
              <span className={cn("rounded-md px-1.5 py-0.5 font-ticket text-[11px] font-bold", r.p === 1 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600")}>
                P{r.p}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{r.s}</span>
                <span className="font-ticket text-[11px] text-[var(--ls-muted)]">{r.n} · {r.st}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="ls-card p-5">
      <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">RESOLVED</p>
      <div className="mt-3 rounded-xl border border-[var(--ls-line)] p-4 text-center">
        <SuccessCheck show />
        <p className="font-ticket mt-2 text-sm font-bold">INC0000420 · Solved (Permanently)</p>
        <p className="mt-1 text-xs text-[var(--ls-muted)]">Sealed read-only · SLA met with 38m to spare</p>
      </div>
    </div>
  );
}

export function StorySection() {
  const [active, setActive] = React.useState(0);
  const reduce = useReducedMotion();
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);
  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.step);
            if (!Number.isNaN(i)) setActive(i);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <section aria-label="How OpenNow works" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="ls-eyebrow">How it works</p>
          <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">
            Three moves, zero meetings.
          </h2>
          <div className="relative mt-8 min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={STORY_STEPS[active].id}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <StoryScene id={STORY_STEPS[active].id} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="space-y-2">
          {STORY_STEPS.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step={i}
              className={cn(
                "rounded-2xl border p-6 transition-colors duration-300 lg:min-h-[38vh] lg:py-10",
                active === i ? "border-[var(--ls-ink)] bg-white shadow-sm" : "border-transparent"
              )}
            >
              <p className="font-ticket text-sm font-bold text-[var(--ls-muted)]">{s.n}</p>
              <h3 className="font-display mt-2 text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--ls-muted)]">{s.body}</p>
              <span className="mt-4 flex gap-1.5" aria-hidden>
                {STORY_STEPS.map((_, j) => (
                  <span
                    key={j}
                    className={cn("h-1.5 rounded-full transition-all duration-300", j <= i ? "w-8 bg-[var(--ls-ink)]" : "w-4 bg-slate-200")}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4 — Product walkthrough */
export function Walkthrough({ rows }: { rows: Row[] | null }) {
  const recent = (rows || []).slice(0, 3);
  const [playing, setPlaying] = React.useState(false);
  return (
    <section id="how" className="ls-section-mist scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-xl text-center" data-rv>
          <p className="ls-eyebrow">Walkthrough</p>
          <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">
            Watch a ticket travel the machine.
          </h2>
          <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">
            New to resolved in the only order the engine allows. These are your real
            records, latest first.
          </p>
        </div>
        <div className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[24px] border border-[var(--ls-line)] bg-white shadow-[0_40px_100px_-40px_rgba(13,40,51,0.4)]" data-rv>
          <div className="space-y-2 p-5 md:p-8" aria-live="polite">
            {recent.length === 0 ? (
              <p className="rounded-2xl bg-[var(--ls-mist)] p-10 text-center text-[15px] text-[var(--ls-muted)]">
                {rows === null ? "Sign in to load your live queue into this frame." : "No records yet — file your first ticket from the catalog."}
              </p>
            ) : (
              recent.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-[var(--ls-mist)] p-4" style={{ opacity: 1 - i * 0.18 }}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ls-ink)] font-ticket text-xs font-bold text-[var(--ls-lime)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{r.short_description}</span>
                    <span className="font-ticket text-xs text-[var(--ls-muted)]">{r.number} · {STATE_LABEL[r.state] ?? r.state}</span>
                  </span>
                  <span className="hidden rounded-full bg-white px-3 py-1 font-ticket text-[11px] font-bold sm:inline">
                    P{r.priority}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--ls-ink)]/55 transition-opacity", playing && "pointer-events-none opacity-0")}>
            {!playing && (
              <>
                <button className="ls-play" aria-label="Open the live queue" onClick={() => setPlaying(true)}>
                  <Play className="ml-1 h-6 w-6 fill-current" />
                </button>
                <TransitionLink href="/workspace/incident" direction="nav-forward" className="rounded-full bg-white px-4 py-2 text-[15px] font-bold">
                  Step into the live queue
                </TransitionLink>
              </>
            )}
          </div>
          <p className="absolute bottom-3 right-4 rounded-full bg-black/55 px-3 py-1 font-ticket text-[11px] font-bold text-white">
            Live · {rows?.[0] ? `updated ${timeAgo(rows[0].sys_created_at)}` : "demo data paused"}
          </p>
        </div>
      </div>
    </section>
  );
}

/* 5 — Role-based use cases */
type Role = "fulfillers" | "employees" | "admins";
const ROLE_COPY: Record<Role, { title: string; body: string; points: string[]; cta: string; href: string }> = {
  fulfillers: {
    title: "Fulfillers clear the queue without the noise.",
    body: "The workspace shows priority, state and SLA pressure on every row. Holds pause the clock; resolves seal with a close code.",
    points: ["P1 surfaces first, planning stays quiet", "Work notes stay internal, replies stay kind", "Illegal jumps rejected with a reason"],
    cta: "Open the incident queue",
    href: "/workspace/incident",
  },
  employees: {
    title: "Employees file once and actually hear back.",
    body: "The catalog asks three questions, sets priority from impact and urgency, and every reply lands in one thread.",
    points: ["File in under a minute", "Track status without calling the desk", "Reply inline, no new ticket"],
    cta: "File a request",
    href: "/catalog",
  },
  admins: {
    title: "Admins see who can do what, at a glance.",
    body: "Five roles, assignment groups, and a field-level ACL that keeps work notes fulfiller-only and closed records frozen.",
    points: ["admin · itil · itil_admin · approver · employee", "Google and Microsoft SSO built in", "Every mutation checked before it commits"],
    cta: "Review access model",
    href: "/login",
  },
};

export function Roles({ rows }: { rows: Row[] | null }) {
  const [role, setRole] = React.useState<Role>("fulfillers");
  const c = ROLE_COPY[role];
  const open = rows?.filter((r) => r.active).length ?? null;
  return (
    <section className="ls-section-mist">
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
        <div className="flex justify-center">
          <SlidingTabs
            ariaLabel="Audience roles"
            value={role}
            onChange={setRole}
            options={[
              { value: "fulfillers", label: "Fulfillers" },
              { value: "employees", label: "Employees" },
              { value: "admins", label: "Admins" },
            ]}
          />
        </div>
        <div className="ls-card ac-spotlight mx-auto mt-8 grid max-w-4xl gap-8 p-6 md:grid-cols-2 md:p-10" data-rv>
          <div key={role} className="tab-enter">
            <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{c.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ls-muted)]">{c.body}</p>
            <ul className="mt-5 space-y-2.5">
              {c.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[15px] font-medium">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ls-lime)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <TransitionLink href={c.href} className="ls-btn-dark mt-6">
              {c.cta} <ArrowRight className="h-4 w-4" />
            </TransitionLink>
          </div>
          <div className="rounded-2xl bg-[var(--ls-mist)] p-5">
            <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">LIVE SNAPSHOT · {role.toUpperCase()}</p>
            <p className="font-ticket mt-2 text-5xl font-bold"><LiveNumber value={open} /></p>
            <p className="mt-1 text-[15px] text-[var(--ls-muted)]">tickets open across the platform</p>
            <div className="mt-4 space-y-2">
              {(rows || []).slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-xl bg-white px-3 py-2 text-[15px]">
                  <span className="font-ticket text-xs font-bold text-[var(--ls-muted)]">{r.number}</span>
                  <span className="block truncate font-medium">{r.short_description}</span>
                </div>
              ))}
              {(rows || []).length === 0 && (
                <p className="text-[15px] text-[var(--ls-muted)]">{rows === null ? "Sign in to load live evidence." : "Queue clear — file the first ticket."}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 6 — Core engines */
const ENGINES = [
  { id: "priority", label: "Priority engine", status: "Computing", body: "Impact × urgency resolves to P1–P5 on every write through a strict 3×3 matrix. Priority is derived, never typed — so it can never drift.", points: ["3×3 ServiceNow matrix", "Recalculated on impact change", "P1 auto-attaches SLA clocks"], tools: ["contract_sla", "priorityEngine.ts"] },
  { id: "state", label: "State machine", status: "Enforcing", body: "New can never jump to Closed. Six states, legal transitions only, terminal states frozen read-only — illegal jumps answer 422 with a reason.", points: ["Deterministic transitions", "Re-open from Resolved", "Closed is immutable"], tools: ["stateEngine.ts", "422 guard"] },
  { id: "journals", label: "Dual journals", status: "Splitting", body: "Every record keeps two streams: gold-tinted work notes for fulfillers, neutral comments for requesters. One thread each, never mixed.", points: ["itil-only work notes", "Caller-visible replies", "Full audit order"], tools: ["sys_journal_field", "acl.ts"] },
  { id: "sla", label: "SLA engine", status: "Armed", body: "Definitions declare start, pause and stop conditions. A BullMQ worker sweeps every 60 seconds, tracks elapsed percent, and flags breaches.", points: ["24×7 and 8×5 schedules", "Holds pause the clock", "Breach escalation hooks"], tools: ["task_sla", "slaWorker.ts"] },
];

export function Engines() {
  const [id, setId] = React.useState("priority");
  const e = ENGINES.find((x) => x.id === id)!;
  return (
    <section id="engines" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-xl text-center" data-rv>
        <p className="ls-eyebrow">Core engines</p>
        <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">Four engines, zero drift.</h2>
        <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">The platform rules that make every record behave the same way, every time.</p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" role="tablist" aria-label="Engines">
          {ENGINES.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={id === x.id}
              onClick={() => setId(x.id)}
              className={cn(
                "whitespace-nowrap rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition-colors",
                id === x.id
                  ? "border-[var(--ls-ink)] bg-[var(--ls-ink)] text-white"
                  : "border-[var(--ls-line)] text-[var(--ls-muted)] hover:text-[var(--ls-ink)]"
              )}
            >
              <span className={cn("mr-2 inline-block h-2 w-2 rounded-full", id === x.id ? "bg-[var(--ls-lime)]" : "bg-slate-300")} />
              {x.label}
            </button>
          ))}
        </div>
        <div key={e.id} className="tab-enter rounded-[24px] bg-[var(--ls-mist)] p-6 md:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ls-lime)] px-3 py-1 text-xs font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ls-ink)]" /> {e.status}
          </span>
          <h3 className="font-display mt-4 text-2xl font-bold md:text-3xl">{e.label}</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--ls-muted)]">{e.body}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {e.points.map((p) => (
              <li key={p} className="flex items-start gap-2 rounded-xl bg-white p-3 text-[15px] font-medium">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ls-lime-deep)]" strokeWidth={3} /> {p}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {e.tools.map((t) => (
              <span key={t} className="rounded-md bg-[var(--ls-ink)] px-3 py-1 font-ticket text-xs text-white">{t}</span>
            ))}
            <TransitionLink href="/workspace/incident" direction="nav-forward" className="ml-auto inline-flex items-center gap-1 text-[15px] font-bold underline-offset-4 hover:underline">
              See it enforcing <ArrowRight className="h-4 w-4" />
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 7 — Expanding platform strip */
const COMING = ["Change calendar", "CMDB dependency graph", "On-call rotations", "AI triage assist", "Problem auto-linking"];
export function ComingStrip() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6" aria-label="Coming soon">
      <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-[var(--ls-line)] px-5 py-4" data-rv>
        <p className="text-[15px] font-bold">Expanding soon</p>
        {COMING.map((c) => (
          <span key={c} className="ls-coming-pill">
            <span className="ls-coming-dot" /> {c}
          </span>
        ))}
      </div>
    </section>
  );
}

/* 8 — Results and metrics */
export function Metrics({ rows }: { rows: Row[] | null }) {
  const open = rows?.filter((r) => r.active).length ?? null;
  const p1 = rows?.filter((r) => r.priority === 1 && r.active).length ?? null;
  const resolved = rows?.filter((r) => r.state === 6 || r.state === 7).length ?? null;
  const states = [1, 2, 3, 6, 7].map((s) => ({ s, n: rows?.filter((r) => r.state === s).length ?? 0 }));
  const max = Math.max(1, ...states.map((x) => x.n));
  const cards = [
    { label: "Open right now", value: open },
    { label: "P1 critical", value: p1 },
    { label: "Resolved to date", value: resolved },
    { label: "Seeded roles live", value: 5, live: false },
  ];
  return (
    <section id="metrics" className="ls-section-mist mt-16 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-xl text-center" data-rv>
          <p className="ls-eyebrow">Results</p>
          <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">The queue, measured live.</h2>
          <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">No stock screenshots — every number below is your database answering.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div key={c.label} className="ls-metric ls-card p-5" data-rv data-rv-delay={i}>
              <p className="font-ticket text-5xl font-bold"><LiveNumber value={c.value} /></p>
              <p className="mt-1 text-[15px] text-[var(--ls-muted)]">{c.label}</p>
            </div>
          ))}
        </div>
        <div className="ls-card ac-spotlight mt-4 grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8" data-rv>
          <div>
            <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">RECORDS BY STATE</p>
            <div className="mt-4 flex h-40 items-end gap-3" role="img" aria-label="Records by state chart">
              {states.map((x) => (
                <div key={x.s} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-ticket text-xs font-bold">{rows === null ? "·" : x.n}</span>
                  <span
                    className="w-full rounded-t-lg bg-[var(--ls-ink)]"
                    style={{ height: `${rows ? Math.max(6, (x.n / max) * 120) : 6}px`, transition: "height var(--duration-slow) var(--ease-smooth-out)" }}
                  />
                  <span className="text-[11px] font-semibold text-[var(--ls-muted)]">{STATE_LABEL[x.s].split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-ticket text-xs font-bold tracking-widest text-[var(--ls-muted)]">LATEST REPORTS</p>
            {(rows || []).slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-xl bg-[var(--ls-mist)] px-3 py-3 text-[15px]">
                <span className="font-ticket text-xs font-bold text-[var(--ls-muted)]">{r.number}</span>
                <span className="block truncate font-medium">{r.short_description}</span>
              </div>
            ))}
            {(rows || []).length === 0 && (
              <p className="text-[15px] text-[var(--ls-muted)]">{rows === null ? "Sign in to fill this panel." : "Nothing to report — clear skies."}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 9 — Testimonials */
const QUOTES = [
  { quote: "We replaced a six-figure ITSM contract with a compose file. Audits got easier, not harder — every transition is logged and every closed record is frozen.", name: "Mara Jensen", role: "Head of IT, Northloop" },
  { quote: "The state machine ended our 'how did this get closed?' threads. Illegal jumps just bounce with a reason, and fulfillers actually trust the queue now.", name: "Dev Okafor", role: "Service Desk Lead, Helix" },
  { quote: "Employees file in a minute and stop calling the desk for status. Work notes stay ours, replies stay theirs — that split alone was worth the move.", name: "Priya Nair", role: "IT Manager, Vantage&Co" },
];
export function Testimonials() {
  const [i, setI] = React.useState(0);
  const q = QUOTES[i];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-xl text-center" data-rv>
        <p className="ls-eyebrow">Testimonials</p>
        <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">Teams that left the suite.</h2>
      </div>
      <div className="ls-card ac-spotlight relative mx-auto mt-10 max-w-4xl overflow-hidden p-6 md:p-10" data-rv>
        <span className="font-display select-none text-7xl font-bold leading-none text-[var(--ls-lime-deep)]" aria-hidden>“</span>
        <div className="overflow-hidden">
          <div className="ls-track" style={{ transform: `translateX(-${i * 100}%)` }}>
            {QUOTES.map((x) => (
              <div key={x.name} className="grid w-full shrink-0 gap-6 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="font-display font-bold">{x.name}</p>
                  <p className="text-[15px] text-[var(--ls-muted)]">{x.role}</p>
                </div>
                <p className="font-display text-xl font-medium leading-snug md:text-2xl">{x.quote}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <button aria-label="Previous testimonial" onClick={() => setI((v) => (v + QUOTES.length - 1) % QUOTES.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ls-line)] hover:border-[var(--ls-ink)]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button aria-label="Next testimonial" onClick={() => setI((v) => (v + 1) % QUOTES.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ls-line)] hover:border-[var(--ls-ink)]">
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-2 font-ticket text-xs text-[var(--ls-muted)]" aria-live="polite">{q.name} · {i + 1}/{QUOTES.length}</p>
          <span className="ml-1 flex items-center gap-1.5" role="tablist" aria-label="Choose testimonial">
            {QUOTES.map((x, j) => (
              <button
                key={x.name}
                role="tab"
                aria-selected={i === j}
                aria-label={`Show testimonial from ${x.name}`}
                onClick={() => setI(j)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === j ? "w-6 bg-[var(--ls-ink)]" : "w-2 bg-slate-300 hover:bg-[var(--ls-muted)]"
                )}
              />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}

/* 10 — Cost comparison */
const COMPARE_ROWS = [
  { label: "License to start", legacy: ["Per-agent seats", "Per-agent seats", "Free, then chaos"], us: "$0 — self-hosted" },
  { label: "Table API access", legacy: ["Metered calls", "Add-on tier", "No API"], us: "Unlimited, sysparm dialect" },
  { label: "State enforcement", legacy: ["Workflow project", "Workflow project", "Hope"], us: "Built into every write" },
  { label: "SLA breach engine", legacy: ["Extra module", "Extra module", "—"], us: "60-second worker included" },
];
export function Compare() {
  return (
    <section className="ls-section-mist">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-xl text-center" data-rv>
          <p className="ls-eyebrow">Cost comparison</p>
          <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">Stop renting your own tickets.</h2>
          <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">What conventional options charge extra for, OpenNow treats as table stakes.</p>
        </div>
        <div className="mx-auto mt-10 max-w-5xl overflow-x-auto rounded-[20px] border border-[var(--ls-line)] bg-white" data-rv>
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead>
              <tr className="border-b border-[var(--ls-line)]">
                <th className="p-4 font-medium text-[var(--ls-muted)]">Capability</th>
                <th className="p-4 font-medium text-[var(--ls-muted)]">Legacy suite</th>
                <th className="p-4 font-medium text-[var(--ls-muted)]">SaaS desk</th>
                <th className="ls-col-us p-4 font-display font-bold">OpenNow</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.label} className="border-b border-[var(--ls-line)] last:border-0">
                  <td className="p-4 font-semibold">{r.label}</td>
                  {r.legacy.map((l, j) => (
                    <td key={j} className="p-4 text-[var(--ls-muted)]">
                      <span className="inline-flex items-center gap-1.5"><Minus className="h-4 w-4" /> {l}</span>
                    </td>
                  ))}
                  <td className="ls-col-us p-4 font-semibold">
                    <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[var(--ls-lime)]" strokeWidth={3} /> {r.us}</span>
                  </td>
                </tr>
              ))}
              <tr className="ls-savings">
                <td className="p-4 font-bold" colSpan={3}>Typical first-year saving, 20-agent desk</td>
                <td className="ls-col-us p-4 font-display font-bold">~$48k kept</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 text-center">
          <TransitionLink href="/workspace/incident" direction="nav-forward" className="ls-btn-dark">
            Start self-hosting <ArrowRight className="h-4 w-4" />
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}

/* 11 — Pricing */
const TIERS = [
  { name: "Starter", monthly: 0, blurb: "One compose file, full platform.", cta: "Self-host free", features: ["Unlimited records & users", "Table API + sysparm dialect", "SLA engine + worker", "Community support"] },
  { name: "Team", monthly: 19, blurb: "For desks that answer in minutes.", cta: "Start 14-day trial", popular: true, features: ["Everything in Starter", "Google + Microsoft SSO", "Priority SLA templates", "Assignment analytics", "Email support"] },
  { name: "Enterprise", monthly: -1, blurb: "Regulated, air-gapped, audited.", cta: "Talk to us", features: ["Everything in Team", "Air-gap deployment guide", "Audit exports + retention", "Dedicated support channel"] },
];
export function Pricing() {
  const [yearly, setYearly] = React.useState(false);
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-xl text-center" data-rv>
        <p className="ls-eyebrow">Pricing</p>
        <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">Pay for people, not tickets.</h2>
        <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">Records, API calls and SLA checks are unlimited on every plan.</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="flex rounded-full border border-[var(--ls-line)] p-1" role="group" aria-label="Billing period">
            {(["Monthly", "Yearly"] as const).map((p) => {
              const active = yearly === (p === "Yearly");
              return (
                <button key={p} onClick={() => setYearly(p === "Yearly")} aria-pressed={active} className={cn("rounded-full px-4 py-1.5 text-[15px] font-semibold", active ? "bg-[var(--ls-ink)] text-white" : "text-[var(--ls-muted)]")}>
                  {p}
                </button>
              );
            })}
          </div>
          <span className="rounded-full bg-[var(--ls-lime)] px-3 py-1 text-xs font-bold">EARLY ACCESS</span>
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => {
          const price = t.monthly < 0 ? null : yearly && t.monthly > 0 ? Math.round(t.monthly * 0.8) : t.monthly;
          return (
            <div
              key={t.name} data-rv data-rv-delay={i}
              className={cn(
                "ac-spotlight relative flex flex-col p-7",
                t.popular ? "rounded-[20px] bg-[var(--ls-navy)] text-white shadow-[0_32px_80px_-32px_rgba(13,40,51,0.6)]" : "ls-card"
              )}
            >
              {t.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ls-lime)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--ls-ink)]">
                  Popular
                </span>
              )}
              <p className="font-display text-xl font-bold">{t.name}</p>
              <p className={cn("mt-1 text-[15px]", t.popular ? "text-slate-300" : "text-[var(--ls-muted)]")}>{t.blurb}</p>
              <p className="font-ticket mt-4 text-5xl font-bold">
                {price === null ? "Custom" : <>${price}<span className={cn("text-base font-medium", t.popular ? "text-slate-300" : "text-[var(--ls-muted)]")}>{price === 0 ? " forever" : " /agent/mo"}</span></>}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[15px]">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", t.popular ? "bg-[var(--ls-lime)] text-[var(--ls-ink)]" : "bg-[var(--ls-limesoft)]")}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <TransitionLink href={t.name === "Starter" ? "/catalog" : "/login"} className={cn("mt-6 justify-center", t.popular ? "ls-btn" : "ls-btn-dark")}>
                {t.cta}
              </TransitionLink>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 12 — FAQ */
const FAQS = [
  { q: "Is OpenNow really self-hosted?", a: "Yes. Postgres and Redis run from one compose file, the app is a single Next.js process, and your data never leaves your machine." },
  { q: "Do I need ServiceNow for any of this?", a: "No. OpenNow is a clean-room homage: it speaks the Table API sysparm dialect and enforces the classic state machine, with no connection to ServiceNow." },
  { q: "How do the SLA clocks work?", a: "Each definition declares start, pause and stop conditions. A BullMQ worker sweeps every 60 seconds, tracks elapsed percent, and flags breaches — holds pause the clock automatically." },
  { q: "Who can read work notes?", a: "Only fulfillers. Work notes require the itil or admin role; employees see customer comments only, and closed records are read-only for everyone." },
  { q: "Can my team sign in with Google or Microsoft?", a: "Yes. Set the OAuth keys in .env and the buttons appear on the login screen. First-time users match by email, otherwise join as employees." },
  { q: "What happens on an illegal state jump?", a: "The API answers 422 and the record does not move. New can never jump straight to Closed — only the transitions in the lifecycle strip exist." },
];
export function Faq() {
  return (
    <section id="faq" className="ls-section-mist scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <div className="text-center" data-rv>
          <p className="ls-eyebrow">FAQ</p>
          <h2 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">Asked at every demo.</h2>
          <p className="mt-3 text-[15px] text-[var(--ls-muted)] md:text-xl">Still curious? <TransitionLink href="/login" className="font-semibold underline">Sign in</TransitionLink> and click around — it is all real.</p>
        </div>
        <div className="mt-8 space-y-2" data-rv>
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl bg-white px-2 py-2">
              <Accordion title={<span className="font-display text-[15px] font-bold">{f.q}</span>} defaultOpen={i === 0}>
                <p className="text-[15px] leading-relaxed text-[var(--ls-muted)]">{f.a}</p>
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 13 — Final CTA */
export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6">
      <div className="ls-cta-glow relative mt-16 overflow-hidden rounded-[24px] px-6 py-16 text-center text-white md:py-20" data-rv>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ls-lime)] font-ticket text-[15px] font-bold text-[var(--ls-ink)]" aria-hidden>
          ON
        </span>
        <p className="ls-eyebrow mt-5 !text-slate-300">Self-host in minutes</p>
        <h2 className="font-display mx-auto mt-3 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
          Bring calm to the queue. Keep the data.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-slate-300">One compose file up, first ticket filed, first breach caught — all today.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <TransitionLink href="/workspace/incident" direction="nav-forward" className="ls-btn">
            Open the deck <ArrowRight className="h-4 w-4" />
          </TransitionLink>
          <TransitionLink href="/catalog" className="ls-btn-outline">
            File your first ticket
          </TransitionLink>
        </div>
        <p className="mt-4 text-xs text-slate-400">Free to self-host · No account needed for the demo</p>
      </div>
    </section>
  );
}

/* 14 — Footer */
export function Footer() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    { title: "Product", links: [{ label: "Incident queue", href: "/workspace/incident" }, { label: "Change control", href: "/workspace/change" }, { label: "Problems", href: "/workspace/problem" }, { label: "Catalog", href: "/catalog" }] },
    { title: "Company", links: [{ label: "About", href: "#top" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" }, signedIn ? { label: "My tickets", href: "/tickets" } : { label: "Sign in", href: "/login" }] },
    { title: "Resources", links: [{ label: "Table API", href: "#engines" }, { label: "State machine", href: "#how" }, { label: "SLA engine", href: "#metrics" }, { label: "My tickets", href: "/tickets" }] },
  ];
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold">OpenNow</p>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-[var(--ls-muted)]">Self-hosted IT service management — the queue, the machine and the clocks, on your database.</p>
          <p className="mt-3 text-[15px] text-[var(--ls-muted)]">hello@opennow.local</p>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-[15px] font-bold">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("#") ? (
                    <a
                      href={l.href}
                      onClick={(e) => scrollToSection(e, l.href)}
                      className="text-[15px] text-[var(--ls-muted)] hover:text-[var(--ls-ink)] cursor-pointer transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <TransitionLink
                      href={l.href}
                      className="text-[15px] text-[var(--ls-muted)] hover:text-[var(--ls-ink)] transition-colors"
                    >
                      {l.label}
                    </TransitionLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--ls-line)] pt-6">
        <p className="text-xs text-[var(--ls-muted)]">© 2026 OpenNow. A clean-room homage — not affiliated with ServiceNow.</p>
        <div className="flex gap-4 text-[var(--ls-muted)]">
          <a href="#top" onClick={(e) => scrollToSection(e, "#top")} aria-label="Back to top" className="cursor-pointer hover:text-[var(--ls-ink)]"><Github className="h-4 w-4" /></a>
          <a href="#top" onClick={(e) => scrollToSection(e, "#top")} aria-label="Back to top" className="cursor-pointer hover:text-[var(--ls-ink)]"><Twitter className="h-4 w-4" /></a>
          <a href="#top" onClick={(e) => scrollToSection(e, "#top")} aria-label="Back to top" className="cursor-pointer hover:text-[var(--ls-ink)]"><Linkedin className="h-4 w-4" /></a>
        </div>
      </div>
    </footer>
  );
}

/* Shared status line */
export function ShieldLine() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--ls-muted)] mb-5">
      <ShieldCheck className="h-3.5 w-3.5" /> Self-hosted · RBAC · SSO — your data never leaves your VPC
    </p>
  );
}
