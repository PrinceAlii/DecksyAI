import { NextResponse } from "next/server";

import { playerProfileSchema, playerTagParamSchema, errorResponseSchema } from "@/app/api/_schemas";
import { fetchPlayerProfile } from "@/lib/clash-royale";

export async function GET(_: Request, { params }: { params: { tag: string } }) {
  const parsedParams = playerTagParamSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json(errorResponseSchema.parse({ error: "Invalid tag" }), { status: 400 });
  }

  const player = await fetchPlayerProfile(parsedParams.data.tag);
  const payload = playerProfileSchema.parse(player);
  return NextResponse.json(payload, { status: 200 });
}
