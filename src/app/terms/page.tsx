import Link from "next/link";

import { Container } from "@/components/ui/container";

const commitments = [
  "Use Decksy AI for personal, non-commercial Clash Royale play.",
  "Respect Supercell&apos;s Terms of Service when sharing data or deck links.",
  "Do not attempt to reverse engineer or abuse our APIs.",
];

const disclaimers = [
  "Decksy AI is provided " +
    "\"as is\" without warranties. Match outcomes depend on your skill, connection quality, and balance updates outside our control.",
  "Recommendations are based on the latest data available at run time. Meta shifts may reduce accuracy until the next refresh.",
  "You are responsible for securing your devices and player credentials when using the service.",
];

export default function TermsPage() {
  return (
    <div className="bg-background py-16">
      <Container className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-text">Terms of use</h1>
          <p className="text-sm text-text-muted">
            These terms govern your use of Decksy AI. By continuing to browse or interact with the application you agree to the
            commitments below.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text">What you agree to</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
            {commitments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text">Disclaimer</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
            {disclaimers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text">Contact</h2>
          <p className="text-sm text-text-muted">
            For support or questions about these terms, contact us at {" "}
            <Link href="mailto:support@decksy.dev" className="text-text underline underline-offset-2">
              support@decksy.dev
            </Link>
            .
          </p>
          <p className="text-xs text-text-muted">
            Last updated {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
          </p>
        </section>
      </Container>
    </div>
  );
}

