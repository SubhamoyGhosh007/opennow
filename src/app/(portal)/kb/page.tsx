"use client";
import * as React from "react";
import { PortalShell } from "@/components/deck/portal-shell";
import { RevealText } from "@/components/motion/micro";
import { Search, BookOpen, ThumbsUp, Tag, ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransitionLink } from "@/components/motion/nav-transition";
import { useToast } from "@/components/motion/toast";

interface Article {
  id: string;
  number: string;
  short_description: string;
  text: string;
  category: string;
  views: number;
  helpful_count: number;
  sys_created_at: string;
}

export default function KnowledgeBasePortalPage() {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [votedMap, setVotedMap] = React.useState<Record<string, boolean>>({});

  const toast = useToast();

  React.useEffect(() => {
    fetch("/api/now/table/kb_knowledge?sysparm_limit=50")
      .then((r) => r.json())
      .then((j) => {
        setArticles(j.result || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleHelpful = async (art: Article) => {
    if (votedMap[art.id]) return;
    try {
      const nextCount = (art.helpful_count || 0) + 1;
      await fetch(`/api/now/table/kb_knowledge/${art.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful_count: nextCount }),
      });
      setVotedMap((prev) => ({ ...prev, [art.id]: true }));
      setArticles((prev) =>
        prev.map((a) => (a.id === art.id ? { ...a, helpful_count: nextCount } : a))
      );
      toast({ title: "Thanks for your feedback!" });
    } catch {}
  };

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchSearch =
        !q ||
        a.number.toLowerCase().includes(q) ||
        a.short_description.toLowerCase().includes(q) ||
        a.text.toLowerCase().includes(q);
      const matchCat =
        category === "all" || a.category.toLowerCase() === category.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [articles, query, category]);

  return (
    <PortalShell title="Knowledge Base">
      <RevealText
        lines={[
          <strong key="a" className="font-display text-2xl font-bold text-foreground">
            Knowledge & Self-Help
          </strong>,
          <span key="b" className="mt-1 text-[15px] text-muted-foreground">
            Find instant resolutions, setup instructions, and answers before filing a ticket.
          </span>,
        ]}
      />

      {/* Search Input */}
      <div className="deck-panel mt-5 flex items-center gap-2 p-2.5 pl-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search solutions (e.g. VPN, WiFi, Password, Database)..."
          aria-label="Search knowledge base"
          className="h-8 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Categories */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {["all", "Network", "Database", "Hardware", "General"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              category.toLowerCase() === cat.toLowerCase()
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {cat === "all" ? "All Topics" : cat}
          </button>
        ))}
      </div>

      {/* Article List */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Searching knowledge library...
          </div>
        ) : visible.length === 0 ? (
          <div className="deck-panel p-8 text-center space-y-3">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              No matching knowledge articles found.
            </p>
            <TransitionLink
              href="/catalog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Open a request with IT support <ArrowRight className="h-3 w-3" />
            </TransitionLink>
          </div>
        ) : (
          visible.map((art) => {
            const isExpanded = expandedId === art.id;
            return (
              <div
                key={art.id}
                className="deck-panel overflow-hidden transition-all hover:border-primary/50"
              >
                <div
                  className="cursor-pointer p-4"
                  onClick={() => setExpandedId(isExpanded ? null : art.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-ticket text-xs font-semibold text-[hsl(var(--signal))]">
                      {art.number}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {art.category}
                    </Badge>
                  </div>

                  <h3 className="mt-1.5 text-base font-semibold leading-snug">
                    {art.short_description}
                  </h3>

                  {!isExpanded && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {art.text}
                    </p>
                  )}
                </div>

                {/* Expanded Article Body */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 p-4 space-y-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                      {art.text}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs">
                      <div className="text-muted-foreground">
                        Published on {new Date(art.sys_created_at).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Was this article helpful?</span>
                        <Button
                          size="sm"
                          variant={votedMap[art.id] ? "signal" : "outline"}
                          className="h-7 px-2.5 text-xs flex items-center gap-1"
                          onClick={() => handleHelpful(art)}
                          disabled={Boolean(votedMap[art.id])}
                        >
                          {votedMap[art.id] ? (
                            <>
                              <Check className="h-3 w-3" /> Helpful ({art.helpful_count})
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-3 w-3" /> Yes ({art.helpful_count || 0})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Deflection Banner */}
      <div className="mt-8 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        Still cannot find what you are looking for?{" "}
        <TransitionLink href="/catalog" className="font-semibold text-primary hover:underline">
          File an incident or submit a service request →
        </TransitionLink>
      </div>
    </PortalShell>
  );
}
