import { NextResponse } from "next/server";
import { listOpportunities } from "@/graph/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1),
    50,
  );
  return NextResponse.json({ opportunities: listOpportunities(limit) });
}
