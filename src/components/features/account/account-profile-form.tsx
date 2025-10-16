"use client";

import { useFormState } from "react-dom";

import { updateProfileAction, updateProfileInitialState } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AccountProfileFormProps {
  defaults: {
    email: string;
    playerTag: string | null;
    trophies: number | null;
    arena: string | null;
    playstyle: string | null;
    favoriteArchetype: string | null;
    bio: string | null;
  };
}

export function AccountProfileForm({ defaults }: AccountProfileFormProps) {
  const [state, formAction] = useFormState(updateProfileAction, updateProfileInitialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-text">
            Email
          </label>
          <Input id="email" name="email" type="email" value={defaults.email} disabled readOnly />
          <p className="text-xs text-text-muted">Magic links are sent to this address.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="playerTag" className="text-sm font-medium text-text">
            Player tag
          </label>
          <Input
            id="playerTag"
            name="playerTag"
            placeholder="PQ0XYZ9"
            defaultValue={defaults.playerTag ?? ""}
            autoComplete="off"
          />
          <p className="text-xs text-text-muted">We&apos;ll use this to refresh your collection when pulling data.</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="trophies" className="text-sm font-medium text-text">
            Current trophies
          </label>
          <Input
            id="trophies"
            name="trophies"
            type="number"
            inputMode="numeric"
            min={0}
            max={10000}
            placeholder="5600"
            defaultValue={defaults.trophies ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="arena" className="text-sm font-medium text-text">
            Arena / league
          </label>
          <Input id="arena" name="arena" placeholder="Royal Champion" defaultValue={defaults.arena ?? ""} />
        </div>
        <div className="space-y-2">
          <label htmlFor="playstyle" className="text-sm font-medium text-text">
            Preferred playstyle
          </label>
          <Input
            id="playstyle"
            name="playstyle"
            placeholder="Control, Split-lane, or Drill Cycle"
            defaultValue={defaults.playstyle ?? ""}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="favoriteArchetype" className="text-sm font-medium text-text">
            Favourite archetype
          </label>
          <Input
            id="favoriteArchetype"
            name="favoriteArchetype"
            placeholder="Royal Hogs EQ"
            defaultValue={defaults.favoriteArchetype ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="bio" className="text-sm font-medium text-text">
            Coaching focus / goals
          </label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell Decksy what you&apos;re working on so the coaching tips stay relevant."
            defaultValue={defaults.bio ?? ""}
          />
          <p className="text-xs text-text-muted">Max 280 characters.</p>
        </div>
      </div>

      {state.status !== "idle" && state.message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-success/70 bg-success/10 text-success"
              : "border-danger/70 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </div>
      )}

      <Button type="submit" className="w-fit">
        Save changes
      </Button>
    </form>
  );
}
