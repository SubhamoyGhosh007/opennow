"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { ShimmerLine } from "@/components/motion/micro";
import { InitialsAvatar } from "@/components/ui/avatar";

import { SidebarTrigger } from "@/components/ui/sidebar";

/** Status strip — persistent chrome, isolated from page transitions. */
export function StatusStrip({ title, context }: { title: string; context?: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const { data: session } = useSession();
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);
  const name = session?.user?.name || "Console";
  const roles: string[] = ((session?.user as any)?.roles || []) as string[];
  return (
    <header
      style={{ viewTransitionName: "site-chrome" }}
      className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0">
            <p className="font-display text-[15px] font-semibold leading-tight">{title}</p>
            {loading ? (
              <ShimmerLine text="Syncing queue…" />
            ) : (
              <p className="text-xs text-muted-foreground">Live · SLA engine armed</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {context}
          {session?.user && (
            <span className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2">
              <InitialsAvatar name={name} className="h-6 w-6 text-[10px]" />
              <span className="max-w-36 truncate text-xs font-medium" title={`${name} · ${roles.join(", ") || "no roles"}`}>
                {name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Sign out"
                title="Sign out"
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
