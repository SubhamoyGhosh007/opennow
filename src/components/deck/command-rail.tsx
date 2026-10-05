"use client";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, TicketCheck, FolderKanban, Database, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/motion/nav-transition";

const ITEMS = [
  { href: "/workspace/incident", label: "Queue", icon: LayoutGrid },
  { href: "/workspace/change", label: "Changes", icon: FolderKanban },
  { href: "/workspace/problem", label: "Problems", icon: TicketCheck },
  { href: "/catalog", label: "New request", icon: PlusCircle },
  { href: "/tickets", label: "My tickets", icon: TicketCheck },
  { href: "/login", label: "Sign in", icon: LogIn },
];

export function CommandRail() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      style={{ viewTransitionName: "site-chrome" }}
      className="sticky top-0 z-40 flex h-screen w-16 flex-col items-center gap-1 border-r border-border bg-card/80 py-4 backdrop-blur"
    >
      <span className="font-ticket mb-3 text-[10px] font-bold text-[hsl(var(--signal))]">ON</span>
      {ITEMS.map((it) => {
        const active = pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <TransitionLink key={it.href} href={it.href} direction="nav-forward">
            <span
              aria-label={it.label}
              title={it.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(91,140,255,.4)]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {/* Rail tooltip: CSS-only, opens to the right of the trigger. */}
              <span
                role="tooltip"
                className="rail-tip pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-lg"
              >
                {it.label}
              </span>
            </span>
          </TransitionLink>
        );
      })}
      <span className="mt-auto flex flex-col items-center gap-2">
        <span className="ac-pulse-dot h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" aria-label="Systems nominal" />
        <Database className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
    </nav>
  );
}
