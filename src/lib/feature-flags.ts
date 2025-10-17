export type ExperimentKey = "deck-weighting";

interface ExperimentVariantDescriptor {
  name: string;
  weight: number;
  description: string;
}

export interface ExperimentDescriptor {
  key: ExperimentKey;
  description: string;
  owner: string;
  variants: ExperimentVariantDescriptor[];
  defaultVariant: string;
  tags: string[];
}

export interface ExperimentContext {
  userId?: string;
  playerTag?: string;
  sessionId?: string;
  seed?: string;
  overrideVariant?: string;
}

export interface ExperimentAssignment {
  descriptor: ExperimentDescriptor;
  variant: string;
  reason: "override" | "rollout";
}

const experimentCatalog: Record<ExperimentKey, ExperimentDescriptor> = {
  "deck-weighting": {
    key: "deck-weighting",
    description:
      "Tune recommendation scoring weights with player feedback preferences and recent opponent archetype exposure.",
    owner: "Data Science",
    variants: [
      { name: "control", weight: 80, description: "Baseline weights with mild exposure adjustments." },
      {
        name: "meta-aware",
        weight: 20,
        description: "Aggressively rebalances weights using meta exposure and preference signals.",
      },
    ],
    defaultVariant: "control",
    tags: ["rec-engine", "weighting", "experiment"],
  },
};

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash);
}

function resolveSeed(context: ExperimentContext, descriptor: ExperimentDescriptor): string {
  if (context.seed) {
    return context.seed;
  }

  if (context.userId) {
    return `${descriptor.key}:${context.userId}`;
  }

  if (context.playerTag) {
    return `${descriptor.key}:${context.playerTag}`;
  }

  if (context.sessionId) {
    return `${descriptor.key}:${context.sessionId}`;
  }

  return descriptor.key;
}

export function getExperimentDescriptor(key: ExperimentKey): ExperimentDescriptor {
  const descriptor = experimentCatalog[key];
  if (!descriptor) {
    throw new Error(`Experiment descriptor '${key}' not found.`);
  }

  return descriptor;
}

export function listExperiments(): ExperimentDescriptor[] {
  return Object.values(experimentCatalog);
}

export function assignExperimentVariant(key: ExperimentKey, context: ExperimentContext = {}): ExperimentAssignment {
  const descriptor = getExperimentDescriptor(key);

  if (context.overrideVariant) {
    return { descriptor, variant: context.overrideVariant, reason: "override" };
  }

  const seed = resolveSeed(context, descriptor);
  const hash = hashSeed(seed);
  const totalWeight = descriptor.variants.reduce((accumulator, variant) => accumulator + variant.weight, 0);
  const roll = hash % totalWeight;

  let cumulative = 0;
  for (const variant of descriptor.variants) {
    cumulative += variant.weight;
    if (roll < cumulative) {
      return { descriptor, variant: variant.name, reason: "rollout" };
    }
  }

  return { descriptor, variant: descriptor.defaultVariant, reason: "rollout" };
}
