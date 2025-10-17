import type { Metadata } from "next";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { CookieConsentBanner } from "@/components/ui/cookie-consent";

export const metadata: Metadata = {
  title: "Decksy AI",
  description:
    "Personalized Clash Royale deck recommendations, explainers, and coaching built with AI.",
  metadataBase: new URL("https://decksy.ai")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-full bg-background font-sans text-text antialiased",
          "selection:bg-primary/20 selection:text-text"
        )}
      >
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
