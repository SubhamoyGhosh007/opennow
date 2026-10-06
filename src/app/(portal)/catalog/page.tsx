"use client";
import * as React from "react";
import { PortalShell } from "@/components/deck/portal-shell";
import { SuccessCheck, RevealText } from "@/components/motion/micro";
import { useToast } from "@/components/motion/toast";
import {
  Package,
  Laptop,
  Cloud,
  Shield,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

export default function CatalogPage() {
  const [items, setItems] = React.useState<CatItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedItem, setSelectedItem] = React.useState<CatItem | null>(null);

  // Dynamic Form Values
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [ticket, setTicket] = React.useState("");

  const toast = useToast();

  React.useEffect(() => {
    fetch("/api/now/table/sc_cat_item?sysparm_limit=50")
      .then((r) => r.json())
      .then((j) => {
        const list = j.result || [];
        setItems(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case "Laptop":
        return <Laptop className="h-5 w-5 text-blue-400" />;
      case "Cloud":
        return <Cloud className="h-5 w-5 text-sky-400" />;
      case "Shield":
        return <Shield className="h-5 w-5 text-emerald-400" />;
      case "AlertCircle":
        return <AlertCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Package className="h-5 w-5 text-amber-400" />;
    }
  };

  const handleSelectItem = (it: CatItem) => {
    setSelectedItem(it);
    setTicket("");
    // Initialize default values for variables
    const initial: Record<string, any> = {};
    (it.variables || []).forEach((v) => {
      if (v.type === "checkbox") initial[v.name] = false;
      else if (v.type === "select" && v.options && v.options.length > 0) {
        initial[v.name] = v.options[0];
      } else {
        initial[v.name] = "";
      }
    });
    setFormData(initial);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // Check required variables
    for (const v of selectedItem.variables || []) {
      if (v.required && (!formData[v.name] || String(formData[v.name]).trim() === "")) {
        toast({ title: "Validation error", body: `${v.label} is required` });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build composite formatted description
      const varLines = (selectedItem.variables || []).map((v) => {
        const val = formData[v.name];
        return `• ${v.label}: ${val === true ? "Yes" : val === false ? "No" : val || "—"}`;
      });

      const shortDesc =
        formData.short_description ||
        `${selectedItem.name} Request`;

      const fullDesc = `Catalog Item: ${selectedItem.name}\nCategory: ${selectedItem.category}\n\nConfiguration Details:\n${varLines.join("\n")}`;

      // Urgency and Impact mapping
      let urgency = 3;
      let impact = 3;
      if (formData.urgency) {
        urgency = parseInt(String(formData.urgency).charAt(0)) || 3;
      }
      if (formData.impact) {
        impact = parseInt(String(formData.impact).charAt(0)) || 3;
      }

      const res = await fetch("/api/now/table/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_description: shortDesc,
          description: fullDesc,
          category: selectedItem.category.toLowerCase(),
          urgency,
          impact,
        }),
      });

      if (res.ok) {
        const j = await res.json();
        const createdNum = j.result?.number || "INC0000000";
        setTicket(createdNum);
        toast({ title: `Request filed as ${createdNum}`, body: "Our operations team has received your order." });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Submission failed", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      (it.short_description && it.short_description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      selectedCategory === "all" ||
      it.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <PortalShell title="Service Catalog">
      {!selectedItem ? (
        <div className="space-y-4">
          <RevealText
            lines={[
              <strong key="a" className="font-display text-2xl font-bold text-foreground">
                Service Catalog
              </strong>,
              <span key="b" className="mt-1 text-[15px] text-muted-foreground">
                Request equipment, cloud sandboxes, access credentials, and technical services.
              </span>,
            ]}
          />

          {/* Search Bar */}
          <div className="deck-panel mt-5 flex items-center gap-2 p-2.5 pl-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog offerings..."
              aria-label="Search catalog offerings"
              className="h-8 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["all", "Hardware", "Cloud", "Support"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat === "all" ? "All Offerings" : cat}
              </button>
            ))}
          </div>

          {/* Catalog Items Grid */}
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading service offerings...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="deck-panel p-8 text-center text-sm text-muted-foreground">
                No catalog offerings matched your filter.
              </div>
            ) : (
              filteredItems.map((it) => (
                <div
                  key={it.id}
                  onClick={() => handleSelectItem(it)}
                  className="deck-panel cursor-pointer p-4 transition-all hover:border-[hsl(var(--signal))] hover:bg-muted/10 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2.5">
                        {getItemIcon(it.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {it.name}
                          </h3>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {it.category}
                          </Badge>
                        </div>
                        {it.short_description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {it.short_description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Selected Catalog Item Order Form */
        <div className="space-y-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to catalog
          </button>

          <div className="deck-panel p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5">
                {getItemIcon(selectedItem.icon)}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display">{selectedItem.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedItem.short_description}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Order Form */}
          <form onSubmit={handleSubmit} className="deck-panel p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b">
              Request Parameters
            </h3>

            {(selectedItem.variables || []).map((v) => (
              <div key={v.name} className="space-y-1">
                <label className="block text-xs font-medium text-foreground">
                  {v.label} {v.required && <span className="text-rose-500">*</span>}
                </label>

                {v.type === "string" && (
                  <Input
                    required={v.required}
                    value={formData[v.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [v.name]: e.target.value })
                    }
                    placeholder={`Enter ${v.label.toLowerCase()}...`}
                  />
                )}

                {v.type === "textarea" && (
                  <textarea
                    required={v.required}
                    rows={3}
                    value={formData[v.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [v.name]: e.target.value })
                    }
                    placeholder={`Provide details for ${v.label.toLowerCase()}...`}
                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}

                {v.type === "select" && (
                  <select
                    value={formData[v.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [v.name]: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {(v.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {v.type === "checkbox" && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(formData[v.name])}
                      onChange={(e) =>
                        setFormData({ ...formData, [v.name]: e.target.checked })
                      }
                      className="rounded border-input text-[hsl(var(--signal))]"
                    />
                    <span>Yes, enable this option</span>
                  </label>
                )}
              </div>
            ))}

            <div className="pt-3 border-t flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedItem(null)}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="signal" disabled={submitting}>
                  {submitting ? "Submitting Request..." : "Submit Order"}
                </Button>
                <SuccessCheck show={!!ticket} />
              </div>
            </div>

            {ticket && (
              <div className="mt-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-400">Request submitted:</span>{" "}
                  <span className="font-ticket font-bold text-foreground">{ticket}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setSelectedItem(null);
                    setTicket("");
                  }}
                >
                  Order Another Item
                </Button>
              </div>
            )}
          </form>
        </div>
      )}
    </PortalShell>
  );
}
