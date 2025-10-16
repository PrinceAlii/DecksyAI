import { NextResponse } from "next/server";

import { fetchPlayerProfile } from "@/lib/clash-royale";

export async function GET(_: Request, { params }: { params: { tag: string } }) {
  const player = await fetchPlayerProfile(params.tag);
  return NextResponse.json(player, { status: 200 });
}
