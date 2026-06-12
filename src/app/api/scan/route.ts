import { NextResponse } from "next/server";
import { runSwarm } from "@/agents/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runSwarm();
  return NextResponse.json({ ok: true, ...result });
}
