import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — OpenNow",
  description: "The rules for using this OpenNow instance.",
};

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "The service",
    p: [
      "OpenNow provides IT service management tooling — incident, change, problem and request tracking — as self-hosted software run by your organization on its own infrastructure.",
    ],
  },
  {
    h: "Your account",
    p: [
      "You are responsible for activity under your account and for keeping your password confidential. Accounts are provisioned by your workspace administrator, who may suspend or remove them at any time.",
      "Do not share accounts, attempt to access records outside your role, or interfere with other users' work.",
    ],
  },
  {
    h: "Acceptable use",
    p: [
      "Use the platform for legitimate IT and business operations only. Do not upload malicious content, attempt to breach access controls, scrape the service, or use it in violation of applicable law.",
    ],
  },
  {
    h: "Availability",
    p: [
      "The service is provided as-is, without warranties of uninterrupted availability. Because it is self-hosted, uptime depends on the infrastructure of the organization operating this instance.",
    ],
  },
  {
    h: "Liability",
    p: [
      "To the maximum extent permitted by law, the operators of this instance are not liable for indirect or consequential damages arising from use of the service.",
    ],
  },
  {
    h: "Changes",
    p: [
      "These terms may be updated as the platform evolves; material changes will be communicated by your workspace administrator. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    h: "Contact",
    p: [
      "Questions about these terms: contact your workspace administrator or write to subhamoyghosh2017@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="landing-system min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-14 md:px-6">
        <p className="ls-eyebrow">Legal</p>
        <h1 className="font-display mt-3 text-[32px] font-bold tracking-tight md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-[15px] text-[var(--ls-muted)]">
          Last updated October 2026. The short rules for using this instance.
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
          <Link href="/privacy" className="font-semibold underline underline-offset-4">
            Privacy Policy
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
