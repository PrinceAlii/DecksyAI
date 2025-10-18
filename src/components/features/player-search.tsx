"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  normalizePlayerTag,
  playerTagValidationMessage,
  isValidPlayerTag,
} from "@/lib/player-tag";

export function PlayerSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [playerTag, setPlayerTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalized = normalizePlayerTag(playerTag);
    const validationError = playerTagValidationMessage(normalized);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isValidPlayerTag(normalized)) {
      setError("Invalid player tag format");
      return;
    }

    // Navigate to search page with the player tag
    router.push(`/search?tag=${encodeURIComponent(normalized)}`);
    setIsOpen(false);
    setPlayerTag("");
    setError(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 text-text-muted"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search player</span>
      </Button>
    );
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Player tag..."
          value={playerTag}
          onChange={(e) => {
            setPlayerTag(e.target.value);
            setError(null);
          }}
          maxLength={8}
          className="h-9 w-40 pr-8 text-sm sm:w-48"
          autoFocus
        />
        {error && (
          <div className="absolute left-0 top-full mt-1 whitespace-nowrap rounded bg-danger/10 px-2 py-1 text-xs text-danger">
            {error}
          </div>
        )}
      </div>
      <Button type="submit" size="sm" variant="outline">
        <Search className="size-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          setIsOpen(false);
          setPlayerTag("");
          setError(null);
        }}
      >
        <X className="size-4" />
      </Button>
    </form>
  );
}
