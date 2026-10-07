"use client";

import * as React from "react";
import { AppSidebar } from "@/components/deck/app-sidebar";
import { StatusStrip } from "@/components/deck/status-strip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WorkspaceProvider, useWorkspaceLayoutContext } from "@/components/deck/workspace-context";

function PersistentWorkspaceShell({ children }: { children: React.ReactNode }) {
  const wsCtx = useWorkspaceLayoutContext();
  const title = wsCtx?.header.title || "ITSM Command Center";
  const context = wsCtx?.header.context;

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <StatusStrip title={title} context={context} />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <PersistentWorkspaceShell>{children}</PersistentWorkspaceShell>
    </WorkspaceProvider>
  );
}
