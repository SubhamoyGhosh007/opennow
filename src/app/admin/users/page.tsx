"use client";
import * as React from "react";
import { startTransition } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, ShieldCheck } from "lucide-react";
import { DeckShell } from "@/components/deck/deck-shell";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InitialsAvatar } from "@/components/ui/avatar";
import { useToast } from "@/components/motion/toast";
import { QueueSkeletonRows } from "@/components/ui/skeleton";

type UserRow = {
  id: string;
  user_name: string;
  email: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  department?: string | null;
  vip?: boolean;
  active?: boolean;
  roles: string[];
};

const EMPTY = { user_name: "", email: "", first_name: "", last_name: "", password: "", title: "", department: "", active: true, roles: ["employee"] as string[] };

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const selfId = (session?.user as any)?.id as string | undefined;
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [allRoles, setAllRoles] = React.useState<string[]>([]);
  const [modal, setModal] = React.useState<"create" | UserRow | null>(null);
  const [form, setForm] = React.useState(EMPTY);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const toast = useToast();

  const load = React.useCallback(() => {
    fetch("/api/now/table/sys_user?sysparm_limit=200")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => startTransition(() => setUsers(j ? j.result || [] : [])))
      .catch(() => setUsers([]));
    fetch("/api/now/table/sys_user_role?sysparm_limit=50")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setAllRoles(j ? (j.result || []).map((r: any) => r.name) : []))
      .catch(() => setAllRoles([]));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY);
    setError("");
    setModal("create");
  };
  const openEdit = (u: UserRow) => {
    setForm({
      user_name: u.user_name,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      password: "",
      title: u.title || "",
      department: u.department || "",
      active: u.active !== false,
      roles: [...u.roles],
    });
    setError("");
    setModal(u);
  };

  const toggleRole = (r: string) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r],
    }));
  };

  const submit = async () => {
    setError("");
    if (modal === "create" && (!form.user_name.trim() || !form.email.trim() || !form.first_name.trim() || !form.last_name.trim())) {
      setError("Username, email, first and last name are required.");
      return;
    }
    if ((modal === "create" || form.password) && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (modal !== "create" && form.roles.length === 0) {
      setError("Every account needs at least one role.");
      return;
    }
    setBusy(true);
    try {
      const isCreate = modal === "create";
      const url = isCreate ? "/api/now/table/sys_user" : `/api/now/table/sys_user/${(modal as UserRow).id}`;
      const payload: any = isCreate
        ? { ...form }
        : {
            first_name: form.first_name,
            last_name: form.last_name,
            title: form.title || null,
            department: form.department || null,
            active: form.active,
            roles: form.roles,
            ...(form.password ? { password: form.password } : {}),
          };
      const res = await fetch(url, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setError(j.error || `Request failed (${res.status})`);
        return;
      }
      toast({ title: isCreate ? `Account ${j.result.user_name} created` : "Account updated" });
      setModal(null);
      load();
    } catch (e: any) {
      setBusy(false);
      setError(e.message || "Network error");
    }
  };

  const isSelf = modal !== null && modal !== "create" && (modal as UserRow).id === selfId;

  return (
    <DeckShell
      title="Users & access"
      context={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Admin-only. Passwords are hashed server-side and never displayed.
        </p>
        {users === null ? (
          <QueueSkeletonRows rows={6} />
        ) : users.length === 0 ? (
          <div className="deck-panel p-10 text-center">
            <p className="font-display text-xl font-semibold">No accounts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create the first fulfiller to staff the queue.</p>
          </div>
        ) : (
          <div className="deck-panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Account</th>
                  <th className="px-3 py-2.5 font-medium">Contact</th>
                  <th className="px-3 py-2.5 font-medium">Roles</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="deck-row border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <InitialsAvatar name={`${u.first_name} ${u.last_name}`} className="h-8 w-8 text-[11px]" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {u.first_name} {u.last_name}
                            {u.id === selfId && <span className="ml-1.5 text-[11px] text-muted-foreground">(you)</span>}
                          </span>
                          <span className="block truncate font-ticket text-[11px] text-muted-foreground">@{u.user_name}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block truncate font-ticket text-xs">{u.email}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[u.title, u.department].filter(Boolean).join(" · ") || "—"}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {(u.roles || []).map((r) => (
                          <span key={r} className="rounded-full bg-accent px-2 py-0.5 font-ticket text-[10px] font-bold text-accent-foreground">
                            {r}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.active !== false ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"}`}>
                        {u.active !== false ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => openEdit(u)}
                        aria-label={`Edit ${u.user_name}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal !== null} onOpenChange={(v) => !v && setModal(null)}>
        <h2 className="font-display text-lg font-semibold">
          {modal === "create" ? "Create account" : `Edit @${(modal as UserRow)?.user_name}`}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modal === "create" && (
            <>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Username *</span>
                <Input value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} placeholder="j.doe" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Email *</span>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="j.doe@company.com" />
              </label>
            </>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">First name *</span>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Last name *</span>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </label>
          <label className="col-span-2 block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {modal === "create" ? "Password * (min 8 characters)" : "Reset password (leave blank to keep)"}
            </span>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Title</span>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Service Desk Agent" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Department</span>
            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="IT" />
          </label>
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-sm text-muted-foreground">Roles</p>
          <div className="flex flex-wrap gap-1.5">
            {allRoles.map((r) => {
              const on = form.roles.includes(r);
              const locked = isSelf && r === "admin" && on;
              return (
                <button
                  key={r}
                  disabled={locked}
                  onClick={() => toggleRole(r)}
                  aria-pressed={on}
                  title={locked ? "You cannot remove your own admin role" : r}
                  className={`rounded-full px-3 py-1.5 font-ticket text-[11px] font-bold transition-colors ${
                    on ? "bg-primary text-primary-foreground" : "border border-input text-muted-foreground hover:text-foreground"
                  } ${locked ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            disabled={!!isSelf}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            title={isSelf ? "You cannot deactivate your own account" : "Active"}
          />
          Active account
        </label>
        {error && (
          <p className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : modal === "create" ? "Create account" : "Save changes"}
          </Button>
        </div>
      </Modal>
    </DeckShell>
  );
}
