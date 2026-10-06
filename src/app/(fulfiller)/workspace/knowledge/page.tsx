"use client";
import * as React from "react";
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  ThumbsUp,
  Tag,
  Calendar,
  CheckCircle2,
  FileText,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { WorkspaceShell } from "@/components/deck/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { useToast } from "@/components/motion/toast";

interface Article {
  id: string;
  number: string;
  short_description: string;
  text: string;
  category: string;
  workflow_state: string;
  views: number;
  helpful_count: number;
  sys_created_at: string;
}

export default function KnowledgeManagementPage() {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [selectedArticleId, setSelectedArticleId] = React.useState<string | null>(null);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    short_description: "",
    category: "Network",
    workflow_state: "published",
    text: "",
  });

  const toast = useToast();

  const loadArticles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/now/table/kb_knowledge?sysparm_limit=100");
      const j = await res.json();
      const list: Article[] = j.result || [];
      setArticles(list);
      if (list.length > 0 && !selectedArticleId) {
        setSelectedArticleId(list[0].id);
      }
    } catch (e: any) {
      toast({ title: "Failed to load knowledge articles", body: e.message });
    } finally {
      setLoading(false);
    }
  }, [selectedArticleId, toast]);

  React.useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.short_description.trim() || !form.text.trim()) {
      toast({ title: "Validation error", body: "Title and content are required" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/now/table/kb_knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const j = await res.json();
        toast({ title: `${j.result?.number || "Article"} published` });
        setCreateModalOpen(false);
        setForm({
          short_description: "",
          category: "Network",
          workflow_state: "published",
          text: "",
        });
        await loadArticles();
        if (j.result?.id) setSelectedArticleId(j.result.id);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error publishing article", body: err.error || `HTTP ${res.status}` });
      }
    } catch (e: any) {
      toast({ title: "Network error", body: e.message });
    } finally {
      setCreating(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.short_description.toLowerCase().includes(search.toLowerCase()) ||
      a.number.toLowerCase().includes(search.toLowerCase()) ||
      a.text.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      categoryFilter === "all" ||
      a.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const selected = articles.find((a) => a.id === selectedArticleId) || articles[0];

  return (
    <WorkspaceShell title="Knowledge Base" tab="knowledge">
      <div className="space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadArticles()}
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
              New Article
            </Button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["all", "Network", "Database", "Hardware", "General"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                categoryFilter.toLowerCase() === cat.toLowerCase()
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* 2-Column Split: Article List & Article Reader */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Column: Article List (5 cols) */}
          <div className="rounded-lg border bg-card p-3 lg:col-span-5 flex flex-col h-[680px]">
            <div className="mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Articles ({filteredArticles.length})</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                  Loading articles...
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-xs text-muted-foreground text-center p-4">
                  <BookOpen className="h-8 w-8 mb-2 opacity-30" />
                  No articles found matching query.
                </div>
              ) : (
                filteredArticles.map((a) => {
                  const isSelected = selected?.id === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedArticleId(a.id)}
                      className={`cursor-pointer rounded-md border p-3.5 transition-all ${
                        isSelected
                          ? "border-[hsl(var(--signal))] bg-[hsl(var(--signal))]/5 shadow-sm"
                          : "border-transparent bg-background/50 hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-ticket text-xs font-bold text-[hsl(var(--signal))]">
                          {a.number}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {a.category}
                        </Badge>
                      </div>

                      <h4 className="mt-1 font-medium text-sm line-clamp-2">{a.short_description}</h4>

                      <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {a.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {a.helpful_count || 0} helpful
                        </span>
                        <span className="font-ticket ml-auto">
                          {new Date(a.sys_created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Article Reader (7 cols) */}
          <div className="rounded-lg border bg-card p-5 lg:col-span-7 flex flex-col h-[680px] overflow-y-auto">
            {selected ? (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-ticket text-sm font-bold text-[hsl(var(--signal))]">
                      {selected.number}
                    </span>
                    <Badge variant="signal" className="capitalize">
                      {selected.workflow_state}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-xl font-bold">{selected.short_description}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Category: {selected.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Published:{" "}
                      {new Date(selected.sys_created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" /> {selected.helpful_count} people found this helpful
                    </span>
                  </div>
                </div>

                {/* Article Body */}
                <div className="prose prose-sm dark:prose-invert max-w-none py-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.text}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select an article to view details.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create Article */}
        <Modal open={createModalOpen} onOpenChange={(v) => setCreateModalOpen(v)}>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold">Publish Knowledge Article</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Document resolutions, procedures, or known error workarounds for IT agents and customers.
            </p>
          </div>

          <form onSubmit={handleCreateArticle} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Article Title *
              </label>
              <Input
                required
                placeholder="e.g. How to configure corporate mail on iOS / Android..."
                value={form.short_description}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Network">Network</option>
                  <option value="Database">Database</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Workflow State
                </label>
                <select
                  value={form.workflow_state}
                  onChange={(e) => setForm({ ...form, workflow_state: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="review">Under Review</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Article Content (Markdown Supported) *
              </label>
              <textarea
                required
                rows={8}
                placeholder="### Symptom&#10;Describe problem...&#10;&#10;### Resolution Steps&#10;1. Step one...&#10;2. Step two..."
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="signal" disabled={creating}>
                {creating ? "Publishing..." : "Publish Article"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </WorkspaceShell>
  );
}
