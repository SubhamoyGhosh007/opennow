import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenNow",
  description: "How OpenNow handles your data. Self-hosted: your data stays on your server.",
};

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Who controls your data",
    p: [
      "OpenNow is self-hosted software. The organization running this instance is the data controller: your data lives in their PostgreSQL database, on their own server — not with us. There is no central OpenNow cloud receiving your information.",
    ],
  },
  {
    h: "What we store",
    p: [
      "Account data: the name, email address, username, job title, department, and role assignments you or your administrator provide when an account is created.",
      "Work data: tickets, comments, work notes, change records, problems, knowledge articles, and catalog requests you submit while using the platform.",
      "Authentication data: bcrypt-hashed passwords (passwords themselves are never stored), session tokens, and — if you sign in with Google or Microsoft — the basic profile fields (name, email) those providers return.",
    ],
  },
  {
    h: "What we never do",
    p: [
      "No advertising, no sale of personal data, no third-party analytics beacons, and no tracking across other sites. The application makes no outbound calls except those strictly required to function (for example, OAuth sign-in with a provider you explicitly choose).",
    ],
  },
  {
    h: "Cookies",
    p: [
      "A single session cookie keeps you signed in. It is HttpOnly, scoped to this host, and sent only over HTTPS in production. Clearing it signs you out; no other cookies are set.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "Contact your workspace administrator to access, correct, export, or delete your personal data. Administrators can deactivate or remove accounts at any time from Administration → Users & access; deactivation immediately blocks sign-in.",
    ],
  },
  {
    h: "Security",
    p: [
      "Passwords are hashed with bcrypt, access is gated by role-based checks on every request, and closed records become read-only. No system is impenetrable: report suspected issues to your workspace administrator promptly.",
    ],
  },
  {
    h: "Contact",
    p: [
      "For privacy questions about this instance, contact your workspace administrator or write to subhamoyghosh2017@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="landing-system min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-14 md:px-6">
        <p className="ls-eyebrow">Legal</p>
        <h1 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[15px] text-[var(--ls-muted)]">
          Last updated October 2026. Short version: your data stays on your server, and we sell nothing.
        </p>
        <div className="mt-8 space-y-7">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-xl font-bold">{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i} className="mt-2 text-[15px] leading-relaxed text-[var(--ls-muted)]">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <Link href="/terms" className="font-semibold underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          <span className="text-[var(--ls-muted)]">·</span>{" "}
          <Link href="/" className="font-semibold underline underline-offset-4">
            Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
