import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { QueueTable } from "@/components/deck/queue-table";

export default function ProblemListPage() {
  return (
    <WorkspaceShell title="Problem records" tab="problem">
      <QueueTable table="problem" title="the problem queue" />
    </WorkspaceShell>
  );
}
