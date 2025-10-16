import Stripe from "stripe";

import { getServerEnv, isDevelopment } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripeClient) {
    return stripeClient;
  }

  const { STRIPE_SECRET_KEY } = getServerEnv();

  if (!STRIPE_SECRET_KEY) {
    if (isDevelopment()) {
      console.warn("STRIPE_SECRET_KEY missing. Stripe client disabled.");
    }
    return null;
  }

  stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
  });

  return stripeClient;
}
