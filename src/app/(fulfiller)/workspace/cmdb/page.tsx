"use client";
import * as React from "react";
import {
  Database,
  Server,
  Cpu,
  Layers,
  Network,
  Search,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/motion/toast";

interface CI {
  id: string;
  name: string;
  sys_class_name: string;
  operational_status: string;
  ip_address?: string;
  fqdn?: string;
  sys_created_at: string;
}

interface Relation {
  id: string;
  parent_id: string;
  child_id: string;
  relation_type: string;
}

export default function CmdbExplorerPage() {
  const [cis, setCis] = React.useState<CI[]>([]);
  const [relations, setRelations] = React.useState<Relation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCiId, setSelectedCiId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [classFilter, setClassFilter] = React.useState("all");

  // Create CI modal
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newCi, setNewCi] = React.useState({
    name: "",
    sys_class_name: "server",
    operational_status: "operational",
    ip_address: "",
    fqdn: "",
  });
  const [creating, setCreating] = React.useState(false);

  // Add Relation modal
  const [relModalOpen, setRelModalOpen] = React.useState(false);
  const [newRel, setNewRel] = React.useState({
    child_id: "",
    relation_type: "Depends On",
  });
  const [creatingRel, setCreatingRel] = React.useState(false);

  const toast = useToast();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ciRes, relRes] = await Promise.all([
        fetch("/api/now/table/cmdb_ci?sysparm_limit=100"),
        fetch("/api/now/table/cmdb_rel_ci?sysparm_limit=200"),
      ]);
      const ciJson = await ciRes.json();
      const relJson = await relRes.json();

      const ciList = ciJson.result || [];
      setCis(ciList);
      setRelations(relJson.result || []);

      if (ciList.length > 0 && !selectedCiId) {
        setSelectedCiId(ciList[0].id);
      }
    } catch (e: any) {
      toast({ title: "Failed to load CMDB", body: e.message });
    } finally {
      setLoading(false);
    }
  }, [selectedCiId, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCi.name) {
      toast({ title: "Validation error", body: "Name is required" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/now/table/cmdb_ci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCi),
      });
      if (res.ok) {
        const j = await res.json();
        toast({ title: "CI Created", body: `${newCi.name} added to CMDB` });
        setCreateModalOpen(false);
        setNewCi({
          name: "",
          sys_class_name: "server",
          operational_status: "operational",
          ip_address: "",
          fqdn: "",
        });
        await loadData();
        if (j.result?.id) setSelectedCiId(j.result.id);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error creating CI", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCiId || !newRel.child_id) {
      toast({ title: "Validation error", body: "Target CI is required" });
      return;
    }
    setCreatingRel(true);
    try {
      const res = await fetch("/api/now/table/cmdb_rel_ci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: selectedCiId,
          child_id: newRel.child_id,
          relation_type: newRel.relation_type,
        }),
      });
      if (res.ok) {
        toast({ title: "Relation linked", body: "Dependency established successfully" });
        setRelModalOpen(false);
        setNewRel({ child_id: "", relation_type: "Depends On" });
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setCreatingRel(false);
    }
  };

  const selectedCi = cis.find((c) => c.id === selectedCiId) || cis[0];

  // Upstream: CIs where child_id === selectedCi.id (these CIs depend on the selected CI)
  const upstreamRels = selectedCi
    ? relations.filter((r) => r.child_id === selectedCi.id)
    : [];

  // Downstream: CIs where parent_id === selectedCi.id (the selected CI depends on these CIs)
  const downstreamRels = selectedCi
    ? relations.filter((r) => r.parent_id === selectedCi.id)
    : [];

  const filteredCis = cis.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.fqdn && c.fqdn.toLowerCase().includes(search.toLowerCase())) ||
      (c.ip_address && c.ip_address.includes(search));
    const matchesClass =
      classFilter === "all" ||
      c.sys_class_name.toLowerCase() === classFilter.toLowerCase();
    return matchesSearch && matchesClass;
  });

  const getClassIcon = (cls: string) => {
    switch (cls.toLowerCase()) {
      case "database":
        return <Database className="h-4 w-4 text-amber-500" />;
      case "server":
        return <Server className="h-4 w-4 text-blue-500" />;
      case "service":
        return <Layers className="h-4 w-4 text-emerald-500" />;
      case "network":
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <Cpu className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "operational":
        return <Badge variant="signal">Operational</Badge>;
      case "maintenance":
        return <Badge variant="warning">Maintenance</Badge>;
      case "retired":
      case "non-operational":
        return <Badge variant="destructive">Non-Operational</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <WorkspaceShell title="CMDB Explorer" tab="cmdb">
      <div className="space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search CIs by name, IP, or FQDN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="signal"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              New CI
            </Button>
          </div>
        </div>

        {/* Class Filter Badges */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["all", "service", "server", "database", "network"].map((cls) => (
            <button
              key={cls}
              onClick={() => setClassFilter(cls)}
              className={`rounded-full px-3 py-1 font-medium capitalize transition-colors ${
                classFilter === cls
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cls === "all" ? "All Items" : cls}
            </button>
          ))}
        </div>

        {/* Main Grid: CI Inventory + Relationship Graph */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: CI List (5 cols) */}
          <div className="rounded-lg border bg-card p-3 lg:col-span-5 flex flex-col h-[680px]">
            <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Configuration Items ({filteredCis.length})</span>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                  Loading CMDB inventory...
                </div>
              ) : filteredCis.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-xs text-muted-foreground text-center p-4">
                  <Database className="h-8 w-8 mb-2 opacity-30" />
                  No configuration items found. Click "+ New CI" to register an asset.
                </div>
              ) : (
                filteredCis.map((ci) => {
                  const isSelected = selectedCi?.id === ci.id;
                  return (
                    <div
                      key={ci.id}
                      onClick={() => setSelectedCiId(ci.id)}
                      className={`cursor-pointer rounded-md border p-3 transition-all ${
                        isSelected
                          ? "border-[hsl(var(--signal))] bg-[hsl(var(--signal))]/5 shadow-sm"
                          : "border-transparent bg-background/50 hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          {getClassIcon(ci.sys_class_name)}
                          <span className="truncate">{ci.name}</span>
                        </div>
                        {getStatusBadge(ci.operational_status)}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="capitalize font-mono">{ci.sys_class_name}</span>
                        {ci.ip_address && (
                          <span className="font-mono">IP: {ci.ip_address}</span>
                        )}
                        {ci.fqdn && (
                          <span className="truncate font-mono">FQDN: {ci.fqdn}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: CI Details & Relationship Graph (7 cols) */}
          <div className="rounded-lg border bg-card p-4 lg:col-span-7 flex flex-col h-[680px] overflow-y-auto">
            {selectedCi ? (
              <div className="space-y-6">
                {/* CI Header Banner */}
                <div className="border-b pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2.5">
                        {getClassIcon(selectedCi.sys_class_name)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{selectedCi.name}</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{selectedCi.sys_class_name}</span>
                          <span>•</span>
                          <span className="font-mono">ID: {selectedCi.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedCi.operational_status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRelModalOpen(true)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Link Relation
                      </Button>
                    </div>
                  </div>

                  {/* Attributes Table */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-xs sm:grid-cols-4">
                    <div>
                      <div className="text-muted-foreground">Operational Status</div>
                      <div className="font-medium capitalize mt-0.5">{selectedCi.operational_status}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">IP Address</div>
                      <div className="font-mono font-medium mt-0.5">{selectedCi.ip_address || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">FQDN / Host</div>
                      <div className="font-mono font-medium truncate mt-0.5">{selectedCi.fqdn || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Registered</div>
                      <div className="font-mono text-muted-foreground mt-0.5">
                        {new Date(selectedCi.sys_created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual CI Relationship Viewer / Dependency Map */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-[hsl(var(--signal))]" />
                      CI Dependency Map
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {upstreamRels.length} upstream • {downstreamRels.length} downstream
                    </span>
                  </div>

                  {/* Tree Visualization */}
                  <div className="rounded-lg border bg-background/50 p-4 space-y-6">
                    {/* 1. Upstream Section */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                        Upstream Dependencies (Relies On This CI)
                      </div>
                      {upstreamRels.length === 0 ? (
                        <div className="rounded border border-dashed p-2.5 text-center text-xs text-muted-foreground">
                          No upstream services rely on this CI
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {upstreamRels.map((rel) => {
                            const parentCi = cis.find((c) => c.id === rel.parent_id);
                            return (
                              <div
                                key={rel.id}
                                onClick={() => parentCi && setSelectedCiId(parentCi.id)}
                                className="cursor-pointer rounded-md border bg-card p-2.5 hover:border-[hsl(var(--signal))] transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {parentCi && getClassIcon(parentCi.sys_class_name)}
                                    <span className="font-medium text-xs truncate max-w-[140px]">
                                      {parentCi?.name || "Unknown CI"}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                    {rel.relation_type}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. Target (Current) CI in center */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm rounded-lg border-2 border-[hsl(var(--signal))] bg-card p-3 shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getClassIcon(selectedCi.sys_class_name)}
                            <span className="font-bold text-sm">{selectedCi.name}</span>
                          </div>
                          <Badge variant="signal" className="text-[10px]">Active CI</Badge>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground flex justify-between">
                          <span>{selectedCi.sys_class_name}</span>
                          <span className="font-mono">{selectedCi.ip_address || selectedCi.fqdn || ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Downstream Section */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                        Downstream Dependencies (This CI Depends On)
                      </div>
                      {downstreamRels.length === 0 ? (
                        <div className="rounded border border-dashed p-2.5 text-center text-xs text-muted-foreground">
                          No downstream dependencies mapped
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {downstreamRels.map((rel) => {
                            const childCi = cis.find((c) => c.id === rel.child_id);
                            return (
                              <div
                                key={rel.id}
                                onClick={() => childCi && setSelectedCiId(childCi.id)}
                                className="cursor-pointer rounded-md border bg-card p-2.5 hover:border-[hsl(var(--signal))] transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {childCi && getClassIcon(childCi.sys_class_name)}
                                    <span className="font-medium text-xs truncate max-w-[140px]">
                                      {childCi?.name || "Unknown CI"}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                    {rel.relation_type}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a CI to inspect attributes and topology.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create New CI */}
        <Modal
          open={createModalOpen}
          onOpenChange={(v) => setCreateModalOpen(v)}
        >
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold">Register Configuration Item</h2>
            <p className="text-xs text-muted-foreground mt-1">Add a new infrastructure component or business service to the CMDB.</p>
          </div>
          <form onSubmit={handleCreateCi} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                CI Name *
              </label>
              <Input
                required
                placeholder="e.g. redis-cluster-prod, api-gateway-01"
                value={newCi.name}
                onChange={(e) => setNewCi({ ...newCi, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Class
                </label>
                <select
                  value={newCi.sys_class_name}
                  onChange={(e) => setNewCi({ ...newCi, sys_class_name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="server">Server</option>
                  <option value="database">Database</option>
                  <option value="service">Business Service</option>
                  <option value="network">Network Device</option>
                  <option value="application">Application</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Operational Status
                </label>
                <select
                  value={newCi.operational_status}
                  onChange={(e) =>
                    setNewCi({ ...newCi, operational_status: e.target.value })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Non-Operational / Retired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  IP Address (Optional)
                </label>
                <Input
                  placeholder="10.0.0.15"
                  value={newCi.ip_address}
                  onChange={(e) => setNewCi({ ...newCi, ip_address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  FQDN (Optional)
                </label>
                <Input
                  placeholder="db-primary.internal"
                  value={newCi.fqdn}
                  onChange={(e) => setNewCi({ ...newCi, fqdn: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={creating}>
                {creating ? "Creating..." : "Save CI"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Link Relationship */}
        <Modal
          open={relModalOpen}
          onOpenChange={(v) => setRelModalOpen(v)}
        >
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold">Link Dependency for {selectedCi?.name || ""}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Define a directional dependency link between <strong>{selectedCi?.name}</strong> and another configuration item.
            </p>
          </div>
          <form onSubmit={handleCreateRelation} className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Relation Type
              </label>
              <select
                value={newRel.relation_type}
                onChange={(e) => setNewRel({ ...newRel, relation_type: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Depends On">Depends On</option>
                <option value="Runs On">Runs On</option>
                <option value="Connects To">Connects To</option>
                <option value="Hosts">Hosts</option>
                <option value="Uses">Uses</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Target Child CI *
              </label>
              <select
                required
                value={newRel.child_id}
                onChange={(e) => setNewRel({ ...newRel, child_id: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select target CI...</option>
                {cis
                  .filter((c) => c.id !== selectedCi?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.sys_class_name})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRelModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={creatingRel}>
                {creatingRel ? "Linking..." : "Establish Relation"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </WorkspaceShell>
  );
}
