"use client";
import * as React from "react";
import { UserCheck, Users, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/motion/toast";
import { useSession } from "next-auth/react";

interface UserItem {
  id: string;
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
}

interface GroupItem {
  id: string;
  name: string;
  description?: string;
}

export function AssignmentPanel({
  table,
  taskId,
  assignedTo,
  assignmentGroup,
  isClosed,
  onUpdate,
}: {
  table: string;
  taskId: string;
  assignedTo?: string | null;
  assignmentGroup?: string | null;
  isClosed: boolean;
  onUpdate: () => void;
}) {
  const { data: session } = useSession();
  const toast = useToast();

  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [groups, setGroups] = React.useState<GroupItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(assignedTo || "");
  const [selectedGroup, setSelectedGroup] = React.useState(assignmentGroup || "");

  React.useEffect(() => {
    setSelectedUser(assignedTo || "");
  }, [assignedTo]);

  React.useEffect(() => {
    setSelectedGroup(assignmentGroup || "");
  }, [assignmentGroup]);

  React.useEffect(() => {
    // Load available fulfiller users and groups
    Promise.all([
      fetch("/api/now/table/sys_user?sysparm_limit=50").then((r) => r.json()),
      fetch("/api/now/table/sys_user_group?sysparm_limit=50").then((r) => r.json()),
    ])
      .then(([uRes, gRes]) => {
        if (uRes.result) setUsers(uRes.result);
        if (gRes.result) setGroups(gRes.result);
      })
      .catch((e) => console.error("Error loading routing metadata:", e));
  }, []);

  const saveAssignment = async (newAssignee?: string | null, newGroup?: string | null) => {
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        assigned_to: newAssignee !== undefined ? (newAssignee || null) : (selectedUser || null),
        assignment_group: newGroup !== undefined ? (newGroup || null) : (selectedGroup || null),
      };

      const res = await fetch(`/api/now/table/${table}/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Assignment updated" });
        onUpdate();
      } else {
        const j = await res.json().catch(() => ({}));
        toast({ title: "Failed to reassign", body: j.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = () => {
    const currentUserId = (session?.user as any)?.id;
    if (!currentUserId) {
      toast({ title: "Error", body: "User session not found" });
      return;
    }
    setSelectedUser(currentUserId);
    saveAssignment(currentUserId, undefined);
  };

  const currentUserName =
    users.find((u) => u.id === selectedUser)?.first_name +
      " " +
      users.find((u) => u.id === selectedUser)?.last_name ||
    (selectedUser ? "Assigned" : "Unassigned");

  const currentGroupName =
    groups.find((g) => g.id === selectedGroup)?.name || (selectedGroup ? "Assigned Group" : "Unassigned Group");

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-4 w-4 text-[hsl(var(--signal))]" />
          Routing & Assignment
        </h3>
        {!isClosed && (session?.user as any)?.id !== selectedUser && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex items-center gap-1"
            onClick={handleAssignToMe}
            disabled={loading}
          >
            <UserCheck className="h-3.5 w-3.5 text-[hsl(var(--signal))]" />
            Assign to Me
          </Button>
        )}
      </div>

      <div className="space-y-3 text-xs">
        {/* Assignment Group */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Assignment Group</label>
          {isClosed ? (
            <div className="font-medium p-2 rounded bg-muted/30">{currentGroupName}</div>
          ) : (
            <select
              value={selectedGroup}
              disabled={loading}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGroup(val);
                saveAssignment(undefined, val);
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- No Assignment Group --</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-muted-foreground mb-1 font-medium">Assigned Fulfiller</label>
          {isClosed ? (
            <div className="font-medium p-2 rounded bg-muted/30">{currentUserName}</div>
          ) : (
            <select
              value={selectedUser}
              disabled={loading}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUser(val);
                saveAssignment(val, undefined);
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Unassigned --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.user_name})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
