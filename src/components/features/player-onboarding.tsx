"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlayerProfile, QuizResponse } from "@/lib/scoring";
import {
  MIN_PLAYER_TAG_LENGTH,
  describePlayerTagRequirements,
  isValidPlayerTag,
  normalizePlayerTag,
  playerTagValidationMessage,
} from "@/lib/player-tag";

interface BattleLogEntry {
  opponent: string;
  result: "win" | "loss" | "draw";
  deck: string[];
  opponentDeck?: string[];
  timestamp: string;
}

const quizDefaults: QuizResponse = {
  preferredPace: "balanced",
  comfortLevel: "bridge",
  riskTolerance: "mid",
};

const quizSections = [
  {
    key: "preferredPace",
    label: "Preferred pace",
    options: ["aggro", "balanced", "control"],
    icon: Trophy,
  },
  {
    key: "comfortLevel",
    label: "Comfort win condition",
    options: ["cycle", "bridge", "spell"],
    icon: Sparkles,
  },
  {
    key: "riskTolerance",
    label: "Risk tolerance",
    options: ["safe", "mid", "greedy"],
    icon: Sparkles,
  },
] as const satisfies ReadonlyArray<{
  key: keyof QuizResponse;
  label: string;
  options: readonly string[];
  icon: LucideIcon;
}>;

export function PlayerOnboarding() {
  const router = useRouter();
  const [playerTag, setPlayerTag] = useState("");
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [battles, setBattles] = useState<BattleLogEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizResponse>(quizDefaults);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedTag = useMemo(() => normalizePlayerTag(playerTag), [playerTag]);
  const tagIsValid = useMemo(() => isValidPlayerTag(playerTag), [playerTag]);
  const showInlineValidation = playerTag.trim().length > 0 && !tagIsValid;
  const inlineValidationMessage = useMemo(() => {
    if (!showInlineValidation) {
      return null;
    }

    return playerTagValidationMessage(playerTag);
  }, [playerTag, showInlineValidation]);

  useEffect(() => {
    if (player) {
      setStep(2);
    }
  }, [player]);

  function handleTagChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (error) {
      setError(null);
    }
    setPlayerTag(event.target.value);
  }

  async function handleFetchPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const cleanedTag = normalizePlayerTag(playerTag);

    if (!isValidPlayerTag(playerTag)) {
      const msg = playerTagValidationMessage(playerTag) ?? describePlayerTagRequirements();
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      const [playerRes, battleRes] = await Promise.all([
        fetch(`/api/player/${cleanedTag}`),
        fetch(`/api/battles/${cleanedTag}`),
      ]);

      if (!playerRes.ok) {
        throw new Error("Unable to fetch player profile");
      }

      const playerJson = (await playerRes.json()) as PlayerProfile;
      setPlayer(playerJson);

      if (battleRes.ok) {
        const battleJson = (await battleRes.json()) as BattleLogEntry[];
        setBattles(battleJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecommend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!player) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        player,
        quiz,
      };
      
      console.log("Sending recommendation payload:", JSON.stringify(payload, null, 2));
      
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Recommendation error:", errorData);
        throw new Error(errorData?.error || "Failed to generate recommendations");
      }

      const json = (await response.json()) as { sessionId: string };
      setStep(3);
      router.push(`/recommend?sessionId=${json.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  function handleQuizSelection<K extends keyof QuizResponse>(key: K, value: QuizResponse[K]) {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  }

  const recentBattleSummary = useMemo(() => {
    if (battles.length === 0) {
      return null;
    }

    const wins = battles.filter((battle) => battle.result === "win").length;
    const losses = battles.filter((battle) => battle.result === "loss").length;
    const draws = battles.length - wins - losses;
    return { wins, losses, draws };
  }, [battles]);

  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <CardContent className="space-y-8 p-0">
          <div className="space-y-3">
            <CardHeader
              icon={<Sparkles className="size-5" />}
              className="flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div>
                <h2 className="text-2xl font-semibold text-text">Start with your player tag</h2>
              </div>
            </CardHeader>
            <p className="text-sm text-text-muted sm:text-base">
              Securely connect via the Clash Royale API. We fetch your cards and battle history to build a profile in seconds.
            </p>
          </div>
          <form className="grid gap-4 sm:gap-5" aria-label="Player tag" onSubmit={handleFetchPlayer}>
            <label className="block text-sm font-medium text-text-muted" htmlFor="tag">
              Player Tag
            </label>
            <Input
              id="tag"
              name="tag"
              placeholder="#ABC123"
              value={playerTag}
              onChange={handleTagChange}
              autoComplete="off"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={showInlineValidation || Boolean(error)}
              aria-describedby={[
                "player-tag-guidance",
                inlineValidationMessage ? "player-tag-inline-validation" : undefined,
                error ? "player-tag-error" : undefined,
              ]
                .filter(Boolean)
                .join(" ") || undefined}
              data-invalid={showInlineValidation || error ? "true" : undefined}
            />
            <p id="player-tag-guidance" className="text-xs leading-relaxed text-text-muted">
              {describePlayerTagRequirements()}
              {normalizedTag.length > 0 && (
                <span className="mt-1 block text-text">
                  Normalized tag: <span className="font-medium">#{normalizedTag}</span>
                </span>
              )}
            </p>
            {inlineValidationMessage && (
              <p id="player-tag-inline-validation" className="text-xs text-danger">
                {inlineValidationMessage}
              </p>
            )}
            <Button
              type="submit"
              className="w-full justify-center gap-2"
              variant="glow"
              disabled={loading || !tagIsValid}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Fetch my data
            </Button>
            {error && (
              <p id="player-tag-error" className="text-sm text-danger" role="alert" aria-live="polite">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {player && step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-8 md:p-10">
              <CardContent className="space-y-8 p-0">
                <CardHeader
                  icon={<Trophy className="size-5" />}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-text">{player.name}</h3>
                    <p className="text-sm text-text-muted">
                      #{player.tag.replace("#", "")} • {player.trophies} trophies • {player.arena}
                    </p>
                  </div>
                  {recentBattleSummary ? (
                    <div className="flex items-center gap-2 text-xs text-text-muted sm:text-sm">
                      <Badge variant="secondary">{recentBattleSummary.wins}W</Badge>
                      <Badge variant="outline">{recentBattleSummary.losses}L</Badge>
                      <Badge variant="ghost">{recentBattleSummary.draws}D</Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">Battle history unavailable</p>
                  )}
                </CardHeader>

                <form className="grid gap-6" onSubmit={handleRecommend}>
                  <div className="grid gap-4 md:grid-cols-3">
                    {quizSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.key} className="space-y-2">
                          <label className="text-sm font-medium text-text">{section.label}</label>
                          <div className="grid gap-2">
                            {section.options.map((option) => {
                              const isActive = quiz[section.key] === option;
                              return (
                                <Button
                                  key={option}
                                  variant={isActive ? "glow" : "glass"}
                                  asChild
                                >
                                  <motion.button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-3 text-sm"
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    onClick={() =>
                                      handleQuizSelection(
                                        section.key,
                                        option as QuizResponse[keyof QuizResponse]
                                      )
                                    }
                                  >
                                    <span className="capitalize">{option}</span>
                                    <span className="relative flex h-5 w-5 items-center justify-center">
                                      <AnimatePresence initial={false}>
                                        {isActive && (
                                          <motion.span
                                            key="icon"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                                            className="relative flex h-5 w-5 items-center justify-center"
                                          >
                                            <motion.span
                                              aria-hidden
                                              className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/40 via-accent/40 to-transparent blur-md"
                                              animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
                                              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                            />
                                            <Icon className="relative size-4" />
                                          </motion.span>
                                        )}
                                      </AnimatePresence>
                                    </span>
                                  </motion.button>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    type="submit"
                    className="w-full justify-center gap-2"
                    variant="glow"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Generate recommendations
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
