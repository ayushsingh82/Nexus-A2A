import { NextResponse } from "next/server";
import { listExecutions } from "@/agents/store";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 1),
    100,
  );
  return NextResponse.json({ executions: listExecutions(limit) });
}
