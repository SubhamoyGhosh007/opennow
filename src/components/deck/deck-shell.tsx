"use client";
import { CommandRail } from "@/components/deck/command-rail";
import { StatusStrip } from "@/components/deck/status-strip";

export function DeckShell({
  title,
  context,
  children,
}: {
  title: string;
  context?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <CommandRail />
      <div className="min-w-0 flex-1">
        <StatusStrip title={title} context={context} />
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
