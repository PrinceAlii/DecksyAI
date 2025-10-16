import { NextResponse } from "next/server";

import { fetchBattleLog } from "@/lib/clash-royale";

export async function GET(_: Request, { params }: { params: { tag: string } }) {
  const battleLog = await fetchBattleLog(params.tag);
  return NextResponse.json(battleLog, { status: 200 });
}
