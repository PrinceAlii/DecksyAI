"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

import { Button, type ButtonProps } from "@/components/ui/button";

interface SignOutButtonProps extends Omit<ButtonProps, "onClick"> {
  redirectTo?: string;
  label?: string;
}

export function SignOutButton({ redirectTo = "/", label = "Sign out", ...props }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: redirectTo });
  }

  return (
    <Button {...props} onClick={handleSignOut} disabled={isSigningOut || props.disabled}>
      {isSigningOut ? "Signing out..." : label}
    </Button>
  );
}
