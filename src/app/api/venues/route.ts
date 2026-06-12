import { NextResponse } from "next/server";
import { listAgents, listDelegations } from "@/agents/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ agents: listAgents(), delegations: listDelegations() });
}
