import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { QueueTable } from "@/components/deck/queue-table";

export default function ChangeListPage() {
  return (
    <WorkspaceShell title="Change control" tab="change">
      <QueueTable table="change_request" title="the change queue" />
    </WorkspaceShell>
  );
}
