"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Copy,
  Eye,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { cn } from "@/lib/utils";
import { getCardArtUrl, CARD_ART_PLACEHOLDER } from "@/lib/data/card-art";
import { detectDeckArchetype, getArchetypeColor } from "@/lib/deck-builder-utils";

interface DeckData {
  id: string;
  name: string;
  slug: string;
  cards: string[];
  description: string | null;
  isPublic: boolean;
  viewCount: number;
  copyCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  } | null;
}

interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

type SortOption = "newest" | "views" | "copies";

const ARCHETYPES = [
  "All",
  "Cycle",
  "Beatdown",
  "Log Bait",
  "Bridge Spam",
  "Siege",
  "Graveyard",
  "Miner Control",
  "Spell Cycle",
  "Control",
];

function CommunityBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [decks, setDecks] = useState<DeckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sortBy") as SortOption) || "newest");
  const [selectedArchetype, setSelectedArchetype] = useState(searchParams.get("archetype") || "All");
  const [showFilters, setShowFilters] = useState(false);
  
  const currentPage = parseInt(searchParams.get("page") || "1");

  // Fetch decks
  useEffect(() => {
    fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");
      params.set("sortBy", sortBy);
      
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      
      if (selectedArchetype !== "All") {
        params.set("archetype", selectedArchetype);
      }

      const response = await fetch(`/api/deck/custom/public?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch decks");
      }

      const data = await response.json();
      setDecks(data.decks || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decks");
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (updates: Partial<{ search: string; sortBy: SortOption; archetype: string; page: number }>) => {
    const params = new URLSearchParams(searchParams);
    
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }
    
    if (updates.sortBy) {
      params.set("sortBy", updates.sortBy);
    }
    
    if (updates.archetype) {
      if (updates.archetype === "All") {
        params.delete("archetype");
      } else {
        params.set("archetype", updates.archetype);
      }
    }
    
    if (updates.page !== undefined) {
      params.set("page", updates.page.toString());
    } else {
      params.set("page", "1"); // Reset to page 1 on filter change
    }
    
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    updateFilters({ sortBy: newSort });
  };

  const handleArchetypeChange = (archetype: string) => {
    setSelectedArchetype(archetype);
    updateFilters({ archetype });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setSelectedArchetype("All");
    router.push("/decks/browse");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-surface/50 backdrop-blur-sm">
        <Container className="py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </div>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Community Decks</GradientText>
            </h1>
            <p className="text-text-muted">
              Discover and copy decks shared by the Clash Royale community
            </p>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search decks by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      updateFilters({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </form>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="size-4" />
                Filters
                {(selectedArchetype !== "All" || searchQuery) && (
                  <Badge variant="primary" className="ml-1">
                    {[selectedArchetype !== "All", searchQuery].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-3 py-2 rounded-lg border border-border/60 bg-surface text-text text-sm hover:border-primary/40 transition"
              >
                <option value="newest">Newest</option>
                <option value="views">Most Viewed</option>
                <option value="copies">Most Copied</option>
              </select>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-4 p-4 border-border/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text">Archetype</h3>
                {(selectedArchetype !== "All" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ARCHETYPES.map((archetype) => (
                  <Button
                    key={archetype}
                    variant={selectedArchetype === archetype ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleArchetypeChange(archetype)}
                    className="text-xs"
                  >
                    {archetype}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </Container>
      </div>

      {/* Content */}
      <Container className="py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 border-red-500/60 bg-red-500/5 text-center">
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDecks}
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && decks.length === 0 && (
          <Card className="p-12 border-border/60 text-center">
            <TrendingUp className="size-12 mx-auto mb-4 text-text-muted" />
            <h3 className="text-lg font-semibold text-text mb-2">No Decks Found</h3>
            <p className="text-text-muted mb-4">
              {searchQuery || selectedArchetype !== "All"
                ? "Try adjusting your filters"
                : "Be the first to share a deck!"}
            </p>
            {(searchQuery || selectedArchetype !== "All") && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        )}

        {/* Decks Grid */}
        {!loading && !error && decks.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}

            {/* Stats */}
            {pagination && (
              <p className="text-center text-sm text-text-muted mt-6">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} decks
              </p>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function CommunityBrowsePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <CommunityBrowseContent />
    </Suspense>
  );
}

function DeckCard({ deck }: { deck: DeckData }) {
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Mock card data for archetype detection
  const cardData = deck.cards.map((key) => ({
    key,
    name: key,
    elixir: 3,
    category: "support" as const,
    rarity: "common" as const,
  }));

  const archetype = detectDeckArchetype(cardData);
  const archetypeColor = getArchetypeColor(archetype);

  const avgElixir = deck.cards.length > 0 ? (deck.cards.length * 3 / deck.cards.length).toFixed(1) : "0.0";

  const handleImageError = (cardKey: string) => {
    setImageErrors((prev) => new Set(prev).add(cardKey));
  };

  const handleClick = () => {
    router.push(`/deck/${deck.userId}/${deck.slug}`);
  };

  return (
    <Card
      className="group cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition"
      onClick={handleClick}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-text truncate group-hover:text-primary transition flex-1">
              {deck.name}
            </h3>
            <Badge variant="primary" className={cn("text-xs ml-2", archetypeColor)}>
              {archetype}
            </Badge>
          </div>

          {deck.description && (
            <p className="text-sm text-text-muted line-clamp-2 mb-3">
              {deck.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
            <div className="flex items-center gap-1">
              <User className="size-3" />
              <span>{deck.user?.name || "Anonymous"}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="size-3" />
              <span>{deck.viewCount}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Copy className="size-3" />
              <span>{deck.copyCount}</span>
            </div>
          </div>
        </div>

        {/* Card Grid (4x2) */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {deck.cards.slice(0, 8).map((cardKey, index) => (
            <div
              key={`${cardKey}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-md border border-primary/40 bg-surface group-hover:border-primary/60 transition"
            >
              <Image
                src={
                  imageErrors.has(cardKey)
                    ? CARD_ART_PLACEHOLDER
                    : getCardArtUrl({ key: cardKey, image: cardKey })
                }
                alt={cardKey}
                fill
                sizes="80px"
                className="object-cover"
                onError={() => handleImageError(cardKey)}
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{avgElixir} avg elixir</span>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="gap-2"
          >
            <Eye className="size-3.5" />
            View
          </Button>
        </div>
      </div>
    </Card>
  );
}
