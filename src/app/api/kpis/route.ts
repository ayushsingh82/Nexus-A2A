import { NextResponse } from "next/server";
import { getKpis } from "@/agents/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ kpis: getKpis() });
}
