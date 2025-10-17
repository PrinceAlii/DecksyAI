const PLAYER_TAG_ALPHABET = new Set(["0", "2", "8", "9", "P", "Y", "L", "Q", "G", "R", "J", "C", "U", "V"]);

const CHARACTER_CORRECTIONS: Record<string, string> = {
  O: "0",
};

export const MIN_PLAYER_TAG_LENGTH = 8;
export const MAX_PLAYER_TAG_LENGTH = 14;

export function normalizePlayerTag(input: string): string {
  if (!input) {
    return "";
  }

  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .split("")
    .map((character) => CHARACTER_CORRECTIONS[character] ?? character)
    .filter((character) => PLAYER_TAG_ALPHABET.has(character))
    .join("");
}

export function isValidPlayerTag(input: string): boolean {
  const normalized = normalizePlayerTag(input);
  return normalized.length >= MIN_PLAYER_TAG_LENGTH && normalized.length <= MAX_PLAYER_TAG_LENGTH;
}

export function describePlayerTagRequirements(): string {
  return "Player tags use 0, 2, 8, 9, P, Y, L, Q, G, R, J, C, U, or V and are at least 8 characters long.";
}
