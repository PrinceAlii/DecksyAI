import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SavedDecksClient } from "@/components/features/account/saved-decks-client";
import { getServerAuthSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Decks | Decksy AI",
  description: "Manage your custom Clash Royale deck builds",
};

export default async function SavedDecksPage() {
  const session = await getServerAuthSession();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/decks");
  }
  
  return <SavedDecksClient userId={session.user.id} />;
}
