import { NextResponse } from "next/server";

import { playerProfileSchema, playerTagParamSchema, errorResponseSchema } from "@/app/api/_schemas";
import { fetchPlayerProfile } from "@/lib/clash-royale";

export async function GET(_: Request, { params }: { params: { tag: string } }) {
  const parsedParams = playerTagParamSchema.safeParse(params);
  if (!parsedParams.success) {
    const errorMessage = parsedParams.error.errors[0]?.message ?? "Invalid tag";
    return NextResponse.json(errorResponseSchema.parse({ error: errorMessage }), { status: 400 });
  }

  try {
    const player = await fetchPlayerProfile(parsedParams.data.tag);
    const parsed = playerProfileSchema.safeParse(player);
    
    if (!parsed.success) {
      console.error("Player profile validation failed:", parsed.error);
      return NextResponse.json(
        errorResponseSchema.parse({ 
          error: "Invalid player data received from API", 
          details: parsed.error.flatten() 
        }), 
        { status: 500 }
      );
    }
    
    return NextResponse.json(parsed.data, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch player:", error);
    return NextResponse.json(
      errorResponseSchema.parse({ error: "Failed to fetch player profile" }),
      { status: 500 }
    );
  }
}
