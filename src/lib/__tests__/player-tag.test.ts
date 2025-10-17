import { describe, expect, it } from "vitest";

import {
  MIN_PLAYER_TAG_LENGTH,
  describePlayerTagRequirements,
  isValidPlayerTag,
  normalizePlayerTag,
} from "@/lib/player-tag";

describe("normalizePlayerTag", () => {
  it("removes prefixes and invalid characters", () => {
    expect(normalizePlayerTag("#py-lg")).toBe("PYLG");
  });

  it("uppercases characters and maps common mistakes", () => {
    expect(normalizePlayerTag("o28yqgrj")).toBe("028YQGRJ");
  });

  it("ignores unsupported digits", () => {
    expect(normalizePlayerTag("123456")).toBe("2");
  });
});

describe("isValidPlayerTag", () => {
  it("accepts cleaned tags of the right length", () => {
    const value = "#py lqgrjc";
    expect(isValidPlayerTag(value)).toBe(true);
  });

  it("rejects cleaned tags below the minimum length", () => {
    expect(isValidPlayerTag("py")).toBe(false);
  });

  it("rejects cleaned tags above the maximum length", () => {
    expect(isValidPlayerTag("py".repeat(10))).toBe(false);
  });
});

describe("describePlayerTagRequirements", () => {
  it("mentions the minimum length", () => {
    expect(describePlayerTagRequirements()).toContain(String(MIN_PLAYER_TAG_LENGTH));
  });
});
