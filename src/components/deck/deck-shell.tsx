"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/deck/app-sidebar";
import { StatusStrip } from "@/components/deck/status-strip";
import { CommandPalette } from "@/components/deck/command-palette";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useWorkspaceLayoutContext } from "./workspace-context";

export function DeckShell({
  title,
  context,
  children,
}: {
  title: string;
  context?: React.ReactNode;
  children: React.ReactNode;
}) {
  const wsCtx = useWorkspaceLayoutContext();

  React.useEffect(() => {
    if (wsCtx) {
      wsCtx.setHeader({ title, context });
    }
  }, [wsCtx, title, context]);

  const pageContent = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 p-5 overflow-auto flex flex-col min-h-0"
    >
      {children}
    </motion.div>
  );

  // If nested within persistent WorkspaceLayout, return animated page content directly
  if (wsCtx?.isNested) {
    return (
      <>
        {pageContent}
        <CommandPalette />
      </>
    );
  }

  // Standalone fallback (e.g. /settings, /admin/users)
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <StatusStrip title={title} context={context} />
        <div className="flex-1 overflow-auto flex flex-col min-h-0">{pageContent}</div>
        <CommandPalette />
      </SidebarInset>
    </SidebarProvider>
  );
}
