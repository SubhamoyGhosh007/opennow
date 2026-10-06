"use client";
import { AppSidebar } from "@/components/deck/app-sidebar";
import { StatusStrip } from "@/components/deck/status-strip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <StatusStrip title={title} context={context} />
        <div className="flex-1 p-5 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
