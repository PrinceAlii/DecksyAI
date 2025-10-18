"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DeleteDeckDialogProps {
  isOpen: boolean;
  deckName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteDeckDialog({
  isOpen,
  deckName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteDeckDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md border-red-500/20 bg-surface shadow-2xl">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Delete Deck</h2>
              <p className="text-sm text-text-muted">This action cannot be undone</p>
            </div>
          </div>

          <p className="mb-6 text-sm text-text-muted">
            Are you sure you want to delete <span className="font-semibold text-text">&ldquo;{deckName}&rdquo;</span>?
            This will permanently remove the deck and any associated AI analysis.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Deck"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
