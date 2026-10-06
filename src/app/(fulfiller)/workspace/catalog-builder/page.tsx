"use client";
import * as React from "react";
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  Laptop,
  Cloud,
  Shield,
  HelpCircle,
  FolderPlus,
  Settings2,
} from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/motion/toast";

interface VariableDef {
  name: string;
  label: string;
  type: "string" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

interface CatItem {
  id: string;
  name: string;
  short_description: string;
  category: string;
  icon: string;
  variables: VariableDef[];
  active: boolean;
  sys_created_at: string;
}

export default function CatalogBuilderPage() {
  const [items, setItems] = React.useState<CatItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [shortDescription, setShortDescription] = React.useState("");
  const [category, setCategory] = React.useState("Hardware");
  const [icon, setIcon] = React.useState("Package");
  const [variables, setVariables] = React.useState<VariableDef[]>([
    { name: "short_description", label: "Request Summary", type: "string", required: true },
    { name: "business_justification", label: "Business Justification", type: "textarea", required: true },
  ]);

  // New variable helper
  const [newVarLabel, setNewVarLabel] = React.useState("");
  const [newVarType, setNewVarType] = React.useState<"string" | "textarea" | "select" | "checkbox">("string");
  const [newVarRequired, setNewVarRequired] = React.useState(false);
  const [newVarOptions, setNewVarOptions] = React.useState("");

  const toast = useToast();

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/table/sc_cat_item?sysparm_limit=50");
      const j = await res.json();
      setItems(j.result || []);
    } catch (e: any) {
      toast({ title: "Failed to load catalog items", body: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addVariable = () => {
    if (!newVarLabel.trim()) {
      toast({ title: "Validation error", body: "Question label is required" });
      return;
    }
    const varName = newVarLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const opts = newVarType === "select"
      ? newVarOptions.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    setVariables([
      ...variables,
      {
        name: varName,
        label: newVarLabel.trim(),
        type: newVarType,
        required: newVarRequired,
        options: opts,
      },
    ]);

    setNewVarLabel("");
    setNewVarType("string");
    setNewVarRequired(false);
    setNewVarOptions("");
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Validation error", body: "Item name is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/now/table/sc_cat_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          short_description: shortDescription.trim(),
          category,
          icon,
          variables,
          active: true,
        }),
      });
      if (res.ok) {
        toast({ title: "Catalog item published", body: `${name} is live in the Service Catalog!` });
        setName("");
        setShortDescription("");
        setVariables([
          { name: "short_description", label: "Request Summary", type: "string", required: true },
          { name: "business_justification", label: "Business Justification", type: "textarea", required: true },
        ]);
        await loadItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Failed to save item", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell title="Catalog Builder">
      <div className="space-y-4">
        {/* Banner */}
        <div className="deck-panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold font-display flex items-center gap-2">
              <Layers className="h-5 w-5 text-[hsl(var(--signal))]" />
              Service Catalog Item Builder
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Design dynamic request items and form variables for end-users on the Service Portal.
            </p>
          </div>
          <span className="text-xs font-ticket text-muted-foreground">
            {items.length} Live Items
          </span>
        </div>

        {/* 2-Column Split: Existing Items vs Builder */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: Existing Catalog Items (4 cols) */}
          <div className="rounded-lg border bg-card p-3 lg:col-span-4 flex flex-col h-[720px]">
            <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Catalog Inventory ({items.length})</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
                  Loading catalog items...
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-xs text-muted-foreground text-center p-4">
                  <Package className="h-8 w-8 mb-2 opacity-30" />
                  No catalog items found.
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-md border bg-background/50 p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm truncate">{it.name}</h4>
                      <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                        {it.category}
                      </Badge>
                    </div>
                    {it.short_description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {it.short_description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-ticket">
                      <span>{(it.variables || []).length} form variables</span>
                      <span className="text-emerald-500 font-semibold">Active</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: New Item Builder Form (8 cols) */}
          <div className="rounded-lg border bg-card p-5 lg:col-span-8 flex flex-col h-[720px] overflow-y-auto">
            <form onSubmit={handleSaveItem} className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b">
                  <Settings2 className="h-4 w-4 text-[hsl(var(--signal))]" />
                  Item General Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Catalog Item Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Ergonomic Standing Desk, Snowflake Sandbox, VPN Access"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Cloud">Cloud & Infrastructure</option>
                    <option value="Security">Access & Security</option>
                    <option value="Support">Support & Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Icon Badge
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Package">Package</option>
                    <option value="Laptop">Laptop / Device</option>
                    <option value="Cloud">Cloud Service</option>
                    <option value="Shield">Security & Permissions</option>
                    <option value="HelpCircle">Help / Inquiry</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Brief Description
                  </label>
                  <Input
                    placeholder="Short summary displayed on catalog card..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Variables Section */}
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Form Questions & Variables ({variables.length})
                  </h3>
                </div>

                {/* List of current variables */}
                <div className="space-y-2">
                  {variables.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{v.label}</span>
                        <Badge variant="outline" className="text-[10px] py-0 font-mono">
                          {v.type}
                        </Badge>
                        {v.required && (
                          <span className="text-[10px] text-rose-500 font-semibold">*Required</span>
                        )}
                        {v.options && v.options.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            ({v.options.length} options)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariable(idx)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                        title="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new variable box */}
                <div className="rounded-lg border border-dashed p-3 space-y-3 bg-muted/10">
                  <div className="text-xs font-semibold text-muted-foreground">
                    + Add Form Variable
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="Question label (e.g. Memory Size, Business Reason)"
                        value={newVarLabel}
                        onChange={(e) => setNewVarLabel(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={newVarType}
                        onChange={(e) => setNewVarType(e.target.value as any)}
                        className="w-full rounded-md border bg-background px-2 h-8 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="string">Single-line Text</option>
                        <option value="textarea">Multi-line Text</option>
                        <option value="select">Dropdown Select</option>
                        <option value="checkbox">Checkbox (Yes/No)</option>
                      </select>
                    </div>
                  </div>

                  {newVarType === "select" && (
                    <div>
                      <Input
                        placeholder="Comma-separated options (e.g. 16 GB, 32 GB, 64 GB)"
                        value={newVarOptions}
                        onChange={(e) => setNewVarOptions(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newVarRequired}
                        onChange={(e) => setNewVarRequired(e.target.checked)}
                        className="rounded border-input text-[hsl(var(--signal))]"
                      />
                      Make this question required
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={addVariable}
                      className="h-7 text-xs"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" variant="signal" disabled={saving}>
                  {saving ? "Publishing..." : "Publish Catalog Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
