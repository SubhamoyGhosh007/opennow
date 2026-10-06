"use client";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { DeckShell } from "@/components/deck/deck-shell";
import { SlidingTabs } from "@/components/motion/sliding-tabs";

export function WorkspaceShell({
  title,
  tab,
  children,
}: {
  title: string;
  tab?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <DeckShell
      title={title}
      context={
        tab ? (
          <SlidingTabs
            ariaLabel="Record class"
            value={tab}
            onChange={(v) => {
              // Lateral navigation: no directional slide (no spatial depth),
              // so push without transition types — content reveals animate.
              const map: Record<string, string> = {
                incident: "/workspace/incident",
                change: "/workspace/change",
                problem: "/workspace/problem",
                cmdb: "/workspace/cmdb",
              };
              if (map[v]) startTransition(() => router.push(map[v]));
            }}
            options={[
              { value: "incident", label: "Incidents" },
              { value: "change", label: "Changes" },
              { value: "problem", label: "Problems" },
              { value: "cmdb", label: "CMDB" },
            ]}
          />
        ) : undefined
      }
    >
      {children}
    </DeckShell>
  );
}
