"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Inbox,
  FolderKanban,
  TicketCheck,
  PlusCircle,
  Database,
  BookOpen,
  Users,
  Settings,
  LogOut,
  CornerDownLeft,
} from "lucide-react";

type Hit = {
  id: string;
  number: string;
  short_description: string;
  priority: number;
  table: string;
  base: string;
};

const NAV: { href: string; label: string; hint: string; icon: any; roles?: string[] }[] = [
  { href: "/workspace", label: "Overview dashboard", hint: "Command center", icon: LayoutDashboard },
  { href: "/workspace/incident", label: "Go to incidents", hint: "Queue", icon: Inbox, roles: ["admin", "itil", "itil_admin"] },
  { href: "/workspace/change", label: "Go to changes", hint: "Queue", icon: FolderKanban, roles: ["admin", "itil", "itil_admin"] },
  { href: "/workspace/problem", label: "Go to problems", hint: "Queue", icon: TicketCheck, roles: ["admin", "itil", "itil_admin"] },
  { href: "/workspace/cmdb", label: "Go to CMDB explorer", hint: "Inventory", icon: Database },
  { href: "/workspace/knowledge", label: "Go to knowledge base", hint: "Articles", icon: BookOpen },
  { href: "/catalog", label: "Go to catalog", hint: "Request", icon: PlusCircle },
  { href: "/tickets", label: "Go to my tickets", hint: "Portal", icon: TicketCheck },
  { href: "/settings", label: "Go to settings", hint: "Team", icon: Users },
  { href: "/admin/users", label: "Go to user admin", hint: "Admin", icon: Settings, roles: ["admin"] },
];

const TABLES = [
  { table: "incident", base: "/workspace/incident" },
  { table: "change_request", base: "/workspace/change" },
  { table: "problem", base: "/workspace/problem" },
];

// DeckShell renders per page, so several palettes can mount at once.
// Only the first one owns the global shortcut; the rest stay inert.
let shortcutClaimed = false;

/**
 * Global command palette (⌘K / Ctrl+K): jump to pages, run actions,
 * live-search tickets across queues. Mounted once in DeckShell.
 */
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [live, setLive] = React.useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const roles: string[] = ((session?.user as any)?.roles || []) as string[];

  React.useEffect(() => {
    if (shortcutClaimed) return;
    shortcutClaimed = true;
    setLive(true);
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const external = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("opennow:palette", external);
    return () => {
      shortcutClaimed = false;
      document.removeEventListener("keydown", down);
      window.removeEventListener("opennow:palette", external);
    };
  }, []);

  if (!live) return null;

  React.useEffect(() => {
    if (!open) return;
    const needle = q.trim();
    if (needle.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(`short_descriptionLIKE${needle}`);
        const res = await Promise.all(
          TABLES.map(async ({ table, base }) => {
            const r = await fetch(`/api/now/table/${table}?sysparm_query=${encoded}&sysparm_limit=4`);
            if (!r.ok) return [];
            const j = await r.json();
            return (j.result || []).map((x: any) => ({
              id: x.id,
              number: x.number,
              short_description: x.short_description,
              priority: x.priority,
              table,
              base,
            }));
          })
        );
        setHits(res.flat().slice(0, 9));
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const canSee = (need?: string[]) => !need || need.some((r) => roles.includes(r));
  const nav = NAV.filter((n) => canSee(n.roles));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQ("");
      }}
      label="Command palette"
      className="fixed left-1/2 top-[16vh] z-[100] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
      overlayClassName="fixed inset-0 z-[99] bg-black/50 backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Jump to a page, action, or ticket… (try INC0001)"
          className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-ticket text-[11px] text-muted-foreground">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-[46vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
          {searching ? "Searching queues…" : q.trim().length < 2 ? "Type at least 2 characters to search tickets." : "No matches — try a ticket number or word."}
        </Command.Empty>
        <Command.Group heading="Go to" className="px-2 py-1.5 font-ticket text-[11px] font-bold uppercase tracking-widest text-muted-foreground [&_[cmdk-group-heading]]:px-2">
          {nav.map((n) => (
            <Command.Item
              key={n.href}
              value={`${n.label} ${n.hint}`}
              onSelect={() => go(n.href)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
            >
              <n.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{n.label}</span>
              <span className="font-ticket text-[11px] text-muted-foreground">{n.hint}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions" className="px-2 py-1.5 font-ticket text-[11px] font-bold uppercase tracking-widest text-muted-foreground [&_[cmdk-group-heading]]:px-2">
          <Command.Item
            value="new incident file request catalog"
            onSelect={() => go("/catalog")}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
          >
            <PlusCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">File a new request</span>
            <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </Command.Item>
          <Command.Item
            value="sign out log out"
            onSelect={() => signOut({ callbackUrl: "/login" })}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">Sign out</span>
          </Command.Item>
        </Command.Group>
        {hits.length > 0 && (
          <Command.Group heading="Tickets" className="px-2 py-1.5 font-ticket text-[11px] font-bold uppercase tracking-widest text-muted-foreground [&_[cmdk-group-heading]]:px-2">
            {hits.map((h) => (
              <Command.Item
                key={`${h.table}-${h.id}`}
                value={`${h.number} ${h.short_description}`}
                onSelect={() => go(`${h.base}/${h.id}`)}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <span className="rounded-md bg-accent px-1.5 py-0.5 font-ticket text-[11px] font-bold">P{h.priority}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.short_description}</span>
                  <span className="block truncate font-ticket text-[11px] text-muted-foreground">{h.number}</span>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span><kbd className="font-ticket">↑↓</kbd> navigate</span>
        <span><kbd className="font-ticket">↵</kbd> open</span>
        <span className="ml-auto">Tickets search incidents, changes & problems</span>
      </div>
    </Command.Dialog>
  );
}
