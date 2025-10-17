import { NextResponse } from "next/server";

import { battleLogSchema, errorResponseSchema, playerTagParamSchema } from "@/app/api/_schemas";
import { fetchBattleLog } from "@/lib/clash-royale";

export async function GET(_: Request, { params }: { params: { tag: string } }) {
  const parsedParams = playerTagParamSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json(errorResponseSchema.parse({ error: "Invalid tag" }), { status: 400 });
  }

  const battleLog = await fetchBattleLog(parsedParams.data.tag);
  const payload = battleLogSchema.parse(battleLog);
  return NextResponse.json(payload, { status: 200 });
}
