import { NextResponse } from "next/server";
import { getPortfolio } from "@/agents/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ portfolio: getPortfolio() });
}
