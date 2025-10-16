import { NextRequest, NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const { successUrl, cancelUrl } = (await request.json()) as {
    successUrl: string;
    cancelUrl: string;
  };

  if (!stripe) {
    return NextResponse.json({
      checkoutUrl: cancelUrl,
      message: "Stripe not configured. Using placeholder checkout.",
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Decksy Pro" },
          recurring: { interval: "month" },
          unit_amount: 999,
        },
        quantity: 1,
      },
    ],
  });

  return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
}
