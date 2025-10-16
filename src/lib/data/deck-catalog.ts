export interface DeckCard {
  name: string;
  key: string;
  levelRequirement: number;
  isChamp?: boolean;
}

export interface DeckDefinition {
  slug: string;
  name: string;
  archetype: "beatdown" | "control" | "cycle" | "siege" | "spell" | "tempo";
  trophyRange: [number, number];
  description: string;
  averageElixir: number;
  playstyles: ("aggro" | "control" | "bridge" | "spell" | "cycle")[];
  cards: DeckCard[];
  strengths: string[];
  weaknesses: string[];
}

export const deckCatalog: DeckDefinition[] = [
  {
    slug: "mega-knight-miner-control",
    name: "Mega Knight Miner Control",
    archetype: "control",
    trophyRange: [4500, 8000],
    description: "Grounded control deck that punishes overcommitments and excels at counterpushing.",
    averageElixir: 3.5,
    playstyles: ["control"],
    cards: [
      { name: "Mega Knight", key: "mega_knight", levelRequirement: 13 },
      { name: "Miner", key: "miner", levelRequirement: 13 },
      { name: "Wall Breakers", key: "wall_breakers", levelRequirement: 13 },
      { name: "Bats", key: "bats", levelRequirement: 13 },
      { name: "Inferno Dragon", key: "inferno_dragon", levelRequirement: 13 },
      { name: "Musketeer", key: "musketeer", levelRequirement: 13 },
      { name: "Zap", key: "zap", levelRequirement: 13 },
      { name: "Snowball", key: "snowball", levelRequirement: 13 },
    ],
    strengths: ["Punishes bridge spam", "Resilient defense", "Strong counterpush potential"],
    weaknesses: ["Struggles vs air swarm", "Requires precise elixir management"],
  },
  {
    slug: "royal-giant-fisherman",
    name: "Royal Giant Fisherman",
    archetype: "beatdown",
    trophyRange: [5000, 9000],
    description: "Control the tempo with Fisherman pulls and chip damage while defending efficiently.",
    averageElixir: 4.1,
    playstyles: ["bridge", "control"],
    cards: [
      { name: "Royal Giant", key: "royal_giant", levelRequirement: 13 },
      { name: "Fisherman", key: "fisherman", levelRequirement: 13 },
      { name: "Mother Witch", key: "mother_witch", levelRequirement: 13 },
      { name: "Hunter", key: "hunter", levelRequirement: 13 },
      { name: "Lightning", key: "lightning", levelRequirement: 13 },
      { name: "Log", key: "log", levelRequirement: 13 },
      { name: "Electro Spirit", key: "electro_spirit", levelRequirement: 13 },
      { name: "Royal Ghost", key: "royal_ghost", levelRequirement: 13 },
    ],
    strengths: ["Flexible defence", "Reliable win condition", "Punishes heavy tanks"],
    weaknesses: ["Fast cycle matchups", "High skill ceiling"],
  },
  {
    slug: "x-bow-ice-spirit",
    name: "X-Bow Ice Spirit Cycle",
    archetype: "siege",
    trophyRange: [5500, 10000],
    description: "Technical siege deck with fast cycle and relentless chip potential.",
    averageElixir: 3,
    playstyles: ["cycle", "spell"],
    cards: [
      { name: "X-Bow", key: "x_bow", levelRequirement: 13 },
      { name: "Tesla", key: "tesla", levelRequirement: 13 },
      { name: "Archers", key: "archers", levelRequirement: 13 },
      { name: "Knight", key: "knight", levelRequirement: 13 },
      { name: "Ice Spirit", key: "ice_spirit", levelRequirement: 13 },
      { name: "Log", key: "log", levelRequirement: 13 },
      { name: "Fireball", key: "fireball", levelRequirement: 13 },
      { name: "Skeletons", key: "skeletons", levelRequirement: 13 },
    ],
    strengths: ["Outcycles opponents", "High tower damage potential", "Excellent control"],
    weaknesses: ["Needs defensive discipline", "Vulnerable to heavy spells"],
  },
  {
    slug: "lava-hound-balloon",
    name: "Lava Hound Balloon", 
    archetype: "beatdown",
    trophyRange: [4000, 9000],
    description: "Air-focused beatdown deck that overwhelms opponents in double elixir.",
    averageElixir: 4.1,
    playstyles: ["aggro", "bridge"],
    cards: [
      { name: "Lava Hound", key: "lava_hound", levelRequirement: 13 },
      { name: "Balloon", key: "balloon", levelRequirement: 13 },
      { name: "Baby Dragon", key: "baby_dragon", levelRequirement: 13 },
      { name: "Mega Minion", key: "mega_minion", levelRequirement: 13 },
      { name: "Miner", key: "miner", levelRequirement: 13 },
      { name: "Tombstone", key: "tombstone", levelRequirement: 13 },
      { name: "Fireball", key: "fireball", levelRequirement: 13 },
      { name: "Zap", key: "zap", levelRequirement: 13 },
    ],
    strengths: ["Snowballs with support troops", "Multiple win conditions", "Excellent versus ground decks"],
    weaknesses: ["Air-targeting swarms", "Rocket cycle"],
  },
];

export function getDeckBySlug(slug: string): DeckDefinition | undefined {
  return deckCatalog.find((deck) => deck.slug === slug);
}
