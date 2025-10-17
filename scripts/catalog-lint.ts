import process from "node:process";

import { deckCatalog } from "../src/lib/data/deck-catalog";
import { CARD_ELIXIR_COST, getElixirCostForCard } from "../src/lib/data/card-elixir";

type Archetype = (typeof deckCatalog)[number]["archetype"];

const archetypes: Archetype[] = ["beatdown", "control", "cycle", "siege", "spell", "tempo"];

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenSlugs = new Set<string>();
  const archetypeCoverage: Record<Archetype, number> = Object.fromEntries(archetypes.map((arch) => [arch, 0])) as Record<Archetype, number>;

  if (deckCatalog.length < 30 || deckCatalog.length > 50) {
    errors.push(`Deck catalog should contain between 30 and 50 entries. Found ${deckCatalog.length}.`);
  }

  for (const deck of deckCatalog) {
    if (seenSlugs.has(deck.slug)) {
      errors.push(`Duplicate deck slug detected: ${deck.slug}`);
    }
    seenSlugs.add(deck.slug);

    archetypeCoverage[deck.archetype] += 1;

    if (deck.cards.length !== 8) {
      errors.push(`Deck ${deck.slug} should contain exactly 8 cards but has ${deck.cards.length}.`);
    }

    if (!deck.trophyBand.trim()) {
      errors.push(`Deck ${deck.slug} is missing trophyBand metadata.`);
    }

    const [minTrophies, maxTrophies] = deck.trophyRange;
    if (minTrophies < 0 || maxTrophies < 0 || minTrophies > maxTrophies || maxTrophies > 10000) {
      errors.push(`Deck ${deck.slug} has an invalid trophy range: [${minTrophies}, ${maxTrophies}].`);
    }

    if (deck.playstyles.length === 0) {
      warnings.push(`Deck ${deck.slug} does not specify any playstyles.`);
    }

    if (deck.strengths.length === 0 || deck.weaknesses.length === 0) {
      warnings.push(`Deck ${deck.slug} should include strengths and weaknesses notes.`);
    }

    let totalElixir = 0;
    let missingElixirKey = false;
    for (const card of deck.cards) {
      const cost = getElixirCostForCard(card.key);
      if (cost === undefined) {
        missingElixirKey = true;
        errors.push(`No elixir cost found for card key "${card.key}" (deck ${deck.slug}). Update CARD_ELIXIR_COST.`);
      } else {
        totalElixir += cost;
      }
    }

    if (!missingElixirKey) {
      const computedAverage = totalElixir / deck.cards.length;
      const rounded = roundToOneDecimal(computedAverage);
      const declared = roundToOneDecimal(deck.averageElixir);
      const diff = Math.abs(rounded - declared);
      if (diff > 0.1) {
        errors.push(
          `Average elixir mismatch for deck ${deck.slug}. Declared ${deck.averageElixir}, computed ${computedAverage.toFixed(2)}.`,
        );
      } else if (diff > 0.05) {
        warnings.push(
          `Average elixir rounding for deck ${deck.slug} is slightly off (${deck.averageElixir} vs ${computedAverage.toFixed(2)}).`,
        );
      }
    }
  }

  const uncoveredArchetypes = archetypes.filter((arch) => archetypeCoverage[arch] === 0);
  if (uncoveredArchetypes.length > 0) {
    errors.push(`Missing archetype coverage for: ${uncoveredArchetypes.join(", ")}.`);
  }

  const unusedElixirKeys = Object.keys(CARD_ELIXIR_COST).filter((key) =>
    !deckCatalog.some((deck) => deck.cards.some((card) => card.key === key)),
  );
  if (unusedElixirKeys.length > 0) {
    warnings.push(`Elixir cost map contains unused keys: ${unusedElixirKeys.join(", ")}.`);
  }

  if (errors.length > 0) {
    console.error("\n❌ Deck catalog lint failed:");
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    if (warnings.length > 0) {
      console.warn("\n⚠️ Additional warnings:");
      for (const warning of warnings) {
        console.warn(`  • ${warning}`);
      }
    }
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️ Deck catalog lint completed with warnings:");
    for (const warning of warnings) {
      console.warn(`  • ${warning}`);
    }
  }

  console.log(
    `\n✅ Deck catalog lint passed for ${deckCatalog.length} decks. Archetype coverage: ${archetypes
      .map((arch) => `${arch}=${archetypeCoverage[arch]}`)
      .join(", ")}.`,
  );
}

main();
