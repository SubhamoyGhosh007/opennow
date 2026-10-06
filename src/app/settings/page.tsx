"use client";
import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, ShieldCheck, Users, Timer } from "lucide-react";
import { DeckShell } from "@/components/deck/deck-shell";
import { InitialsAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/motion/accordion";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [team, setTeam] = React.useState<any[] | null>(null);
  const [slas, setSlas] = React.useState<any[] | null>(null);
  const name = session?.user?.name || "Console";
  const email = session?.user?.email || "—";
  const roles: string[] = ((session?.user as any)?.roles || []) as string[];

  React.useEffect(() => {
    fetch("/api/now/table/sys_user?sysparm_limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setTeam(j ? j.result || [] : []))
      .catch(() => setTeam([]));
    fetch("/api/now/table/contract_sla?sysparm_limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setSlas(j ? j.result || [] : []))
      .catch(() => setSlas([]));
  }, []);

  return (
    <DeckShell title="Settings">
      <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
        <div id="profile" className="deck-panel scroll-mt-20 space-y-4 p-5">
          <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" /> Profile
          </h2>
          <div className="flex items-center gap-3">
            <InitialsAvatar name={name} className="h-12 w-12 text-sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              <p className="truncate font-ticket text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roles.length === 0 && <span className="text-xs text-muted-foreground">No roles assigned.</span>}
            {roles.map((r) => (
              <span key={r} className="rounded-full bg-accent px-2.5 py-1 font-ticket text-[11px] font-bold text-accent-foreground">
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Profile fields are managed by your workspace admin. Roles gate every page:
            the fulfiller workspace needs <span className="font-ticket">itil</span>, the portal needs any session.
          </p>
          <Button variant="destructive" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        <div className="deck-panel space-y-4 p-5">
          <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
            <Timer className="h-5 w-5 text-primary" /> SLA definitions
          </h2>
          {slas === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : slas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No SLA definitions seeded.</p>
          ) : (
            <ul className="space-y-2">
              {slas.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.name}</span>
                    <span className="font-ticket text-[11px] text-muted-foreground">{s.target} · {s.schedule}</span>
                  </span>
                  <span className="font-ticket shrink-0 text-xs font-bold">{s.duration_minutes}m</span>
                </li>
              ))}
            </ul>
          )}
          <div id="team" className="scroll-mt-20">
          <Accordion title={`Team directory (${(team || []).length})`}>
            <ul className="space-y-2">
              {(team || []).map((u: any) => (
                <li key={u.id} className="flex items-center gap-2.5 text-sm">
                  <InitialsAvatar name={`${u.first_name} ${u.last_name}`} className="h-7 w-7 text-[10px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{u.first_name} {u.last_name}</span>
                    <span className="block truncate font-ticket text-[11px] text-muted-foreground">{u.email}</span>
                  </span>
                  {u.vip && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">VIP</span>}
                </li>
              ))}
              {team !== null && team.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> No teammates visible.
                </li>
              )}
            </ul>
          </Accordion>
          </div>
        </div>
      </div>
    </DeckShell>
  );
}
