import Link from "next/link";

import { Container } from "@/components/ui/container";

const sections = [
  {
    title: "Data we collect",
    body: [
      "Player tag, arena, trophy range, and deck recommendations generated during your session.",
      "Feedback you voluntarily submit through thumbs up/down ratings and notes.",
      "Technical logs required to keep the service reliable (request IDs, timestamps).",
    ],
  },
  {
    title: "How we use it",
    body: [
      "Generate personalised deck recommendations and AI explainers for your current session.",
      "Improve scoring rules and explainer prompts based on anonymised insights.",
      "Detect abuse and maintain the stability of our Clash Royale API integrations.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can delete recommendation history at any time from the history page.",
      "We only store sessions for 30 days unless you opt into an account (coming soon).",
      "Contact privacy@decksy.ai for exports or deletion requests—expect a response within 7 days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-background py-16">
      <Container className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-text">Privacy policy</h1>
          <p className="text-sm text-text-muted">
            Updated {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}. Decksy AI
            respects your time and your data—we only collect what we need to recommend decks.
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-text">{section.title}</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
                {section.body.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="space-y-2 text-sm text-text-muted">
          <p>
            Need something else? Email us at {" "}
            <Link href="mailto:privacy@decksy.ai" className="text-text underline underline-offset-2">
              privacy@decksy.ai
            </Link>{" "}
            and we&apos;ll help you out.
          </p>
          <p>
            For additional legal information, please review our {" "}
            <Link href="/terms" className="text-text underline underline-offset-2">
              terms of use
            </Link>
            .
          </p>
        </footer>
      </Container>
    </div>
  );
}

