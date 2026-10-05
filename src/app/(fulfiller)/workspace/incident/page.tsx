import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { QueueTable } from "@/components/deck/queue-table";

export default function IncidentListPage() {
  return (
    <WorkspaceShell title="Incident queue" tab="incident">
      <QueueTable table="incident" title="the incident queue" />
    </WorkspaceShell>
  );
}
