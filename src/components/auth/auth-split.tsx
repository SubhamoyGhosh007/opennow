"use client";
import * as React from "react";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  Building2,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  Check,
} from "lucide-react";
import { TransitionLink } from "@/components/motion/nav-transition";
import { cn } from "@/lib/utils";

/* ---------- form atoms (reference-styled, 12px inputs) ---------- */

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--ls-ink)]">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}

export function AuthInput({
  icon,
  right,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <span className="flex h-12 items-center gap-2.5 rounded-xl border border-[var(--ls-line)] bg-white px-3.5 transition-colors focus-within:border-[var(--ls-ink)]">
      {icon && <span className="shrink-0 text-[var(--ls-muted)]">{icon}</span>}
      <input
        {...props}
        className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#9aa3a8]"
      />
      {right}
    </span>
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = React.useState(false);
  return (
    <AuthInput
      {...props}
      type={show ? "text" : "password"}
      icon={<LockKeyhole className="h-[18px] w-[18px]" />}
      right={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="shrink-0 text-[var(--ls-muted)] hover:text-[var(--ls-ink)]"
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      }
    />
  );
}

export function MailIcon() {
  return <Mail className="h-[18px] w-[18px]" />;
}

export function OrgIcon() {
  return <Building2 className="h-[18px] w-[18px]" />;
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-4 py-1 text-xs text-[#9aa3a8]" aria-hidden>
      <span className="h-px flex-1 bg-[var(--ls-line)]" /> or <span className="h-px flex-1 bg-[var(--ls-line)]" />
    </div>
  );
}

/* ---------- evidence panel (original OpenNow content) ---------- */

function Ring({ value, max = 100, label, sub }: { value: number; max?: number; label: string; sub: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, value / max));
  return (
    <div className="rounded-2xl border border-[var(--ls-line)] bg-white p-3 text-center">
      <p className="text-[11px] font-bold text-[var(--ls-muted)]">{label}</p>
      <svg viewBox="0 0 64 64" className="mx-auto mt-2 h-16 w-16 -rotate-90" role="img" aria-label={`${label} ${value} of ${max}`}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e7ecee" strokeWidth="7" />
        <circle
          cx="32" cy="32" r={r} fill="none" stroke="var(--ls-lime-deep)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c.toFixed(1)} strokeDashoffset={off.toFixed(1)}
        />
        <text x="32" y="36" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--ls-ink)" transform="rotate(90 32 32)">
          {value}
        </text>
      </svg>
      <p className="font-ticket text-[10px] text-[var(--ls-muted)]">/{max}</p>
      <p className="mt-1 text-[11px] font-medium text-[var(--ls-muted)]">{sub}</p>
    </div>
  );
}

const PREVIEW_RECORDS = [
  { n: "INC0001042", s: "Email sync failing for sales", p: 1 },
  { n: "INC0001041", s: "VPN drops on night shift", p: 2 },
  { n: "INC0001040", s: "Printer jam, floor 3", p: 4 },
  { n: "CHG0000220", s: "Failover drill Sunday", p: 2 },
  { n: "INC0001039", s: "SSO loop on Safari", p: 2 },
  { n: "PRB0000114", s: "DHCP lease exhaustion", p: 3 },
];

export function EvidencePanel() {
  return (
    <div className="relative hidden h-full overflow-hidden rounded-[24px] bg-[#eef1f2] p-8 lg:block" aria-label="Product preview">
      {/* floating lime badges + orbit */}
      <span className="absolute right-16 top-24 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ls-lime)]" aria-hidden>
        <BarChart3 className="h-5 w-5 text-[var(--ls-ink)]" />
      </span>
      <span className="absolute right-8 top-48 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ls-lime)]" aria-hidden>
        <Sparkles className="h-4 w-4 text-[var(--ls-ink)]" />
      </span>
      <span className="absolute -right-20 top-40 h-56 w-56 rounded-full border border-dashed border-[var(--ls-ink)]/20" aria-hidden />

      <h2 className="font-display relative mx-auto max-w-md text-center text-4xl font-bold leading-tight tracking-tight">
        Pick up where the queue left off.
      </h2>

      {/* queue overview card */}
      <div className="relative mt-6 rounded-2xl border border-[var(--ls-line)] bg-white p-5 shadow-[0_24px_64px_-32px_rgba(13,40,51,0.35)]">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold">Queue overview</p>
          <span className="rounded-full bg-[var(--ls-limesoft)] px-2.5 py-1 text-[11px] font-bold">Updated just now</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ls-ink)] font-ticket text-xs font-bold text-[var(--ls-lime)]">N</span>
          <div>
            <p className="font-display text-xl font-bold">Northloop IT</p>
            <p className="text-xs text-[var(--ls-muted)]">northloop.it</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Service Desk", "Network Tier 2", "3 groups armed"].map((c) => (
            <span key={c} className="rounded-full bg-[var(--ls-mist)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ls-muted)]">{c}</span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PREVIEW_RECORDS.map((r) => (
            <span key={r.n} className="flex items-center justify-between gap-1 rounded-xl bg-[var(--ls-mist)] px-2.5 py-2">
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">{r.n}</span>
                <span className="block truncate text-[11px] text-[var(--ls-muted)]">{r.s}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--ls-muted)]" />
            </span>
          ))}
        </div>
      </div>

      {/* floating convert card */}
      <div className="absolute bottom-56 right-6 flex w-72 items-center gap-3 rounded-2xl border border-[var(--ls-line)] bg-white p-4 shadow-[0_24px_64px_-24px_rgba(13,40,51,0.4)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ls-limesoft)]">
          <Target className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-tight">Turn this alert into a change</span>
          <span className="block text-[11px] text-[var(--ls-muted)]">3 risk checks ready</span>
        </span>
        <TransitionLink href="/workspace/change" className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--ls-lime)] px-3 py-2 text-xs font-bold">
          Create <ChevronRight className="h-3.5 w-3.5" />
        </TransitionLink>
      </div>

      {/* signals */}
      <div className="mt-4">
        <p className="text-[15px] font-bold">Queue signals <span className="ml-1 rounded-full bg-[var(--ls-limesoft)] px-2 py-0.5 text-[11px]">4</span></p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Ring value={92} label="Resolution SLA" sub="Needs watch" />
          <Ring value={18} max={100} label="P1 share" sub="Of open" />
          <Ring value={3} max={5} label="Groups armed" sub="Coverage" />
          <Ring value={2} max={2} label="Streams split" sub="Notes / replies" />
        </div>
      </div>

      {/* complete banner */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--ls-line)] bg-white p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ls-lime)]">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Your queue health check is complete.</span>
          <span className="block text-xs text-[var(--ls-muted)]">You are all set for Monday morning.</span>
        </span>
        <TransitionLink href="/workspace/incident" direction="nav-forward" className="shrink-0 rounded-full border border-[var(--ls-line)] px-3 py-2 text-xs font-bold hover:border-[var(--ls-ink)]">
          View queue
        </TransitionLink>
      </div>
    </div>
  );
}

/* ---------- split shell ---------- */

export function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <main className="landing-system grid min-h-screen bg-white lg:grid-cols-[1fr_1.15fr]">
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <div className="hidden p-3 lg:block">
        <EvidencePanel />
      </div>
    </main>
  );
}

export function AuthLogo() {
  return (
    <p className="font-display text-[26px] font-extrabold tracking-tight">
      OpenNow<span className="text-[var(--ls-lime-deep)]">.</span>
    </p>
  );
}
