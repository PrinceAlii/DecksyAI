const PLAYER_TAG_ALPHABET = new Set(["0", "2", "8", "9", "P", "Y", "L", "Q", "G", "R", "J", "C", "U", "V"]);

const CHARACTER_CORRECTIONS: Record<string, string> = {
  O: "0",
};

export const MIN_PLAYER_TAG_LENGTH = 7;
export const MAX_PLAYER_TAG_LENGTH = 14;

/**
 * Normalize a user-supplied player tag.
 * - Strips a leading '#' if present
 * - Uppercases
 * - Removes any non-alphanumeric separators
 * - Applies common character corrections (e.g. O -> 0)
 * - Filters to the allowed Clash Royale tag alphabet
 */
export function normalizePlayerTag(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Prefer the token after a leading '#' if supplied (users often paste '#ABC123')
  const raw = input.trim();
  const maybeHashIndex = raw.indexOf("#");
  const candidate = maybeHashIndex >= 0 ? raw.slice(maybeHashIndex + 1) : raw;

  return candidate
    .toUpperCase()
    // remove any characters except letters/numbers
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

/**
 * Return a short human-readable requirement string for UI guidance
 */
export function describePlayerTagRequirements(): string {
  return `Player tags use the characters ${Array.from(PLAYER_TAG_ALPHABET).join(", ")} and are ${MIN_PLAYER_TAG_LENGTH}-${MAX_PLAYER_TAG_LENGTH} characters long.`;
}

/**
 * Return a validation error message for display; returns null when valid.
 */
export function playerTagValidationMessage(input: string): string | null {
  const normalized = normalizePlayerTag(input);
  if (normalized.length === 0) {
    return "Only enter characters found in Clash Royale tags.";
  }
  if (normalized.length < MIN_PLAYER_TAG_LENGTH) {
    const remaining = MIN_PLAYER_TAG_LENGTH - normalized.length;
    return `Add ${remaining} more ${remaining === 1 ? "character" : "characters"} to reach a valid tag.`;
  }
  if (normalized.length > MAX_PLAYER_TAG_LENGTH) {
    return `Player tags must be no more than ${MAX_PLAYER_TAG_LENGTH} characters.`;
  }
  return null;
}
