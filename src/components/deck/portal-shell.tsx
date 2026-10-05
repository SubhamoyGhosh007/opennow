"use client";
import { DeckShell } from "@/components/deck/deck-shell";

export function PortalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DeckShell title={title}>
      <div className="mx-auto max-w-2xl">
        {/* Paper sheet on the dark deck — the portal's distinct surface. */}
        <div className="rounded-2xl border border-slate-200 bg-[#fbfcff] p-6 text-slate-900 shadow-[0_24px_80px_-24px_rgba(10,14,26,.55)]">
          {children}
        </div>
      </div>
    </DeckShell>
  );
}
