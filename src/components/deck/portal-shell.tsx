"use client";
import { DeckShell } from "@/components/deck/deck-shell";

export function PortalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DeckShell title={title}>
      <div className="mx-auto max-w-2xl">{children}</div>
    </DeckShell>
  );
}
