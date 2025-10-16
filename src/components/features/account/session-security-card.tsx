"use client";

import { useFormState } from "react-dom";

import { revokeSessionsAction, revokeSessionsInitialState } from "@/app/account/actions";
import { Button } from "@/components/ui/button";

interface SessionSecurityCardProps {
  sessions: {
    id: string;
    expires: string;
  }[];
}

function formatExpiry(expiry: string): string {
  const date = new Date(expiry);
  if (Number.isNaN(date.getTime())) {
    return expiry;
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SessionSecurityCard({ sessions }: SessionSecurityCardProps) {
  const [state, action] = useFormState(revokeSessionsAction, revokeSessionsInitialState);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text">Session security</h2>
        <p className="text-sm text-text-muted">
          Signed-in sessions live on the server. Revoke them if you lose a device or suspect unauthorised access.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/60">
        <ul className="divide-y divide-border/40 text-sm">
          {sessions.length === 0 && (
            <li className="p-4 text-text-muted">No active sessions found.</li>
          )}
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between p-4">
              <span className="text-text">Session ending {formatExpiry(session.expires)}</span>
              <span className="text-xs text-text-muted">ID: {session.id.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
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

      <form action={action}>
        <Button type="submit" variant="outline">
          Revoke all sessions
        </Button>
      </form>
    </div>
  );
}
