import { NextResponse } from "next/server";
import { recordRealDeposit } from "@/agents/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      agentId?: string;
      agentName?: string;
      protocol?: string;
      action?: string;
      amountUsdc?: number;
      txHash?: string;
      apyBps?: number;
    };

    if (!body.txHash || !body.agentId) {
      return NextResponse.json({ error: "txHash and agentId required" }, { status: 400 });
    }

    recordRealDeposit({
      agentId: body.agentId,
      agentName: body.agentName,
      protocol: body.protocol,
      action: body.action,
      amountUsdc: body.amountUsdc ?? 0,
      txHash: body.txHash,
      apyBps: body.apyBps,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record execution" }, { status: 500 });
  }
}
