import { Metadata } from "next";
import { SavedDecksClient } from "@/components/features/account/saved-decks-client";

export const metadata: Metadata = {
  title: "My Decks | Decksy AI",
  description: "Manage your custom Clash Royale deck builds",
};

export default function SavedDecksPage() {
  return <SavedDecksClient />;
}
