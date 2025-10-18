import type { Metadata } from "next";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { CookieConsentBanner } from "@/components/ui/cookie-consent";

export const metadata: Metadata = {
  title: "Decksy AI",
  description:
    "Personalized Clash Royale deck recommendations, explainers, and coaching built with AI.",
  metadataBase: new URL("https://decksy.dev")
};

// Add common icons so Next/HTML will include favicons and touch icons.
metadata.icons = {
  icon: [
    { url: "/logo.svg", type: "image/svg+xml" },
    { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    { url: "/favicon-16.png", sizes: "16x16", type: "image/png" }
  ],
  apple: [{ url: "/logo.svg", sizes: "180x180", type: "image/svg+xml" }]
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
          "relative min-h-full bg-background font-sans text-text antialiased",
          "selection:bg-primary/20 selection:text-text"
        )}
      >
        <div className="relative z-10 flex min-h-full flex-col">
          {children}
          <CookieConsentBanner />
        </div>
      </body>
    </html>
  );
}
