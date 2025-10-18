"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, AlertCircle, ArrowLeft, TrendingUp } from "lucide-react";

import { SavedDeckCard } from "@/components/features/account/saved-deck-card";
import { DeleteDeckDialog } from "@/components/features/account/delete-deck-dialog";
import { AnalysisModal } from "@/components/features/deck-builder/analysis-modal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedDeck {
  id: string;
  name: string;
  slug: string;
  cards: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: any;
}

type SortOption = "updated" | "name" | "created";

export function SavedDecksClient() {
  const router = useRouter();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; deck: SavedDeck | null }>({
    isOpen: false,
    deck: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [editingDeck, setEditingDeck] = useState<SavedDeck | null>(null);
  const [editName, setEditName] = useState("");
  const [analysisModal, setAnalysisModal] = useState<{ isOpen: boolean; deck: SavedDeck | null; loading: boolean }>({
    isOpen: false,
    deck: null,
    loading: false,
  });

  // Fetch decks
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/deck/custom");
      
      if (!response.ok) {
        throw new Error("Failed to fetch decks");
      }

      const data = await response.json();
      setDecks(data.decks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decks");
    } finally {
      setLoading(false);
    }
  };

  // Sort decks
  const sortedDecks = [...decks].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "updated":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleLoad = (deck: SavedDeck) => {
    // Navigate to deck builder with deck data as query params or state
    router.push(`/deck-builder?loadDeck=${deck.id}`);
  };

  const handleEdit = (deck: SavedDeck) => {
    setEditingDeck(deck);
    setEditName(deck.name);
  };

  const handleSaveEdit = async () => {
    if (!editingDeck || !editName.trim()) return;

    try {
      const response = await fetch("/api/deck/custom", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingDeck.id,
          name: editName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deck name");
      }

      // Update local state
      setDecks(decks.map(d => d.id === editingDeck.id ? { ...d, name: editName.trim() } : d));
      setEditingDeck(null);
      setEditName("");
    } catch (err) {
      alert("Failed to update deck name");
    }
  };

  const handleDelete = (deck: SavedDeck) => {
    setDeleteDialog({ isOpen: true, deck });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.deck) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/deck/custom?id=${deleteDialog.deck.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      // Remove from local state
      setDecks(decks.filter(d => d.id !== deleteDialog.deck!.id));
      setDeleteDialog({ isOpen: false, deck: null });
    } catch (err) {
      alert("Failed to delete deck");
    } finally {
      setDeleting(false);
    }
  };

  const handleAnalyze = async (deck: SavedDeck) => {
    // If deck already has analysis, just show it
    if (deck.aiAnalysis) {
      setAnalysisModal({ isOpen: true, deck, loading: false });
      return;
    }

    // Otherwise, analyze the deck
    setAnalysisModal({ isOpen: true, deck, loading: true });

    try {
      const response = await fetch("/api/analyze/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cards: deck.cards,
          deckId: deck.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze deck");
      }

      const data = await response.json();
      
      // Update deck with analysis
      const updatedDeck = { ...deck, aiAnalysis: data.analysis };
      setDecks(decks.map(d => d.id === deck.id ? updatedDeck : d));
      setAnalysisModal({ isOpen: true, deck: updatedDeck, loading: false });
    } catch (err) {
      alert("Failed to analyze deck");
      setAnalysisModal({ isOpen: false, deck: null, loading: false });
    }
  };

  return (
    <>
      <Container className="py-12 space-y-8">
        {/* Header */}
        <div>
          <Button asChild variant="ghost" className="mb-4 gap-2 text-text-muted hover:text-text">
            <Link href="/account">
              <ArrowLeft className="size-4" />
              Back to Account
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <GradientText as="p" className="text-xs font-semibold uppercase tracking-[0.4em]">
                My Decks
              </GradientText>
              <h1 className="mt-2 text-3xl font-semibold text-text">
                Saved Decks
              </h1>
              <p className="mt-2 text-text-muted">
                Manage your custom deck builds
              </p>
            </div>
            <Button asChild variant="primary" className="gap-2">
              <Link href="/deck-builder">
                <Plus className="size-4" />
                New Deck
              </Link>
            </Button>
          </div>
        </div>

        {/* Sort Controls */}
        {!loading && decks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Sort by:</span>
            <Button
              variant={sortBy === "updated" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("updated")}
            >
              Recently Updated
            </Button>
            <Button
              variant={sortBy === "name" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("name")}
            >
              Name
            </Button>
            <Button
              variant={sortBy === "created" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSortBy("created")}
            >
              Date Created
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 rounded-xl border border-border/60 bg-surface/80 p-5">
                <Skeleton className="h-6 w-3/4" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <Skeleton key={j} className="aspect-[3/4]" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="mx-auto size-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Failed to Load Decks</h3>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <Button onClick={fetchDecks} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && decks.length === 0 && (
          <div className="rounded-xl border border-border/60 bg-surface/80 p-12 text-center">
            <TrendingUp className="mx-auto size-16 text-text-muted mb-4" />
            <h3 className="text-xl font-semibold text-text mb-2">No Saved Decks</h3>
            <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
              You haven&apos;t created any custom decks yet. Start building your perfect deck in the deck builder!
            </p>
            <Button asChild variant="primary" className="gap-2">
              <Link href="/deck-builder">
                <Plus className="size-4" />
                Create Your First Deck
              </Link>
            </Button>
          </div>
        )}

        {/* Decks Grid */}
        {!loading && !error && decks.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedDecks.map((deck) => (
              <SavedDeckCard
                key={deck.id}
                deck={deck}
                onLoad={handleLoad}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        )}

        {/* Edit Name Modal */}
        {editingDeck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border/60 bg-surface p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-semibold text-text">Edit Deck Name</h3>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                placeholder="Deck name"
                className="mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditingDeck(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  disabled={!editName.trim()}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <DeleteDeckDialog
        isOpen={deleteDialog.isOpen}
        deckName={deleteDialog.deck?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, deck: null })}
        isDeleting={deleting}
      />

      {/* Analysis Modal */}
      <AnalysisModal
        isOpen={analysisModal.isOpen}
        onClose={() => setAnalysisModal({ isOpen: false, deck: null, loading: false })}
        analysis={analysisModal.deck?.aiAnalysis || null}
        isLoading={analysisModal.loading}
        canSave={false}
      />
    </>
  );
}
