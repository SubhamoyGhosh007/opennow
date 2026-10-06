"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  TicketCheck,
  PlusCircle,
  Users,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TransitionLink } from "@/components/motion/nav-transition";
import { InitialsAvatar } from "@/components/ui/avatar";

type Item = { href: string; hash?: string; label: string; icon: any };
type Group = { id: string; label: string; roles?: string[]; items: Item[] };

const GROUPS: Group[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { href: "/workspace", label: "Overview", icon: LayoutDashboard },
      { href: "/tickets", label: "My tickets", icon: TicketCheck },
    ],
  },
  {
    id: "queue",
    label: "Queue",
    roles: ["admin", "itil", "itil_admin"],
    items: [
      { href: "/workspace/incident", label: "Incidents", icon: Inbox },
      { href: "/workspace/change", label: "Changes", icon: FolderKanban },
      { href: "/workspace/problem", label: "Problems", icon: TicketCheck },
    ],
  },
  {
    id: "request",
    label: "Request",
    items: [{ href: "/catalog", label: "New request", icon: PlusCircle }],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/settings", hash: "#team", label: "Team & access", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function GroupSection({ group, pathname }: { group: Group; pathname: string }) {
  const [open, setOpen] = React.useState(true);
  const [hash, setHash] = React.useState("");
  React.useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);
  const isActive = (it: Item) => {
    if (it.hash) return pathname === it.href && hash === it.hash;
    if (it.href === "/settings") return pathname === "/settings" && hash !== "#team";
    if (it.href === "/workspace") return pathname === "/workspace";
    return pathname === it.href || pathname.startsWith(it.href + "/");
  };
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <ul className="mt-0.5 space-y-1">
          {group.items.map((it) => {
            const active = isActive(it);
            const Icon = it.icon;
            return (
              <li key={it.href + it.label}>
                <TransitionLink href={it.hash ? `${it.href}${it.hash}` : it.href} direction="nav-forward">
                  <span
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-white/10 font-medium text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#c8ff00]" aria-hidden />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {it.label}
                  </span>
                </TransitionLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const roles: string[] = ((session?.user as any)?.roles || []) as string[];
  const name = session?.user?.name || "Console";
  const visible = GROUPS.filter((g) => !g.roles || g.roles.some((r) => roles.includes(r)));

  return (
    <aside
      style={{ viewTransitionName: "site-chrome" }}
      className="sticky top-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur"
      aria-label="Workspace navigation"
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <span className="font-ticket flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          ON
        </span>
        <span className="font-display text-[15px] font-bold tracking-tight">OpenNow</span>
      </div>
      <nav className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
        {visible.map((g) => (
          <GroupSection key={g.id} group={g} pathname={pathname} />
        ))}
      </nav>
      <div className="border-t border-border p-3">
        {session?.user ? (
          <span className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <InitialsAvatar name={name} className="h-8 w-8 text-[11px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{name}</span>
              <span className="block truncate font-ticket text-[10px] text-muted-foreground">
                {roles.slice(0, 2).join(" · ") || "signed in"}
              </span>
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <TransitionLink href="/login" className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground">
            Sign in
          </TransitionLink>
        )}
      </div>
    </aside>
  );
}
