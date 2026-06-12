import { NextResponse } from "next/server";
import { listOpportunities } from "@/agents/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ opportunities: listOpportunities() });
}
