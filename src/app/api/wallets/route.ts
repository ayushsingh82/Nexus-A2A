import { NextResponse } from "next/server";
import {
  circleConfigStatus,
  listArgoWallets,
  provisionArgoWallets,
} from "@/lib/circle";
import { listVenues } from "@/graph/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallets
 *
 * Returns Argo's Circle wallets on Arc Testnet, with USDC/EURC/USYC balances.
 * If creds aren't configured yet, returns a 503 with a clear `reason`.
 */
export async function GET() {
  const status = circleConfigStatus();
  if (!status.ok) {
    return NextResponse.json(
      { ok: false, configured: false, reason: status.reason },
      { status: 503 },
    );
  }

  try {
    const wallets = await listArgoWallets();
    return NextResponse.json({ ok: true, configured: true, wallets });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, configured: true, error: msg },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wallets
 *
 * Provisions one Circle wallet per venue + one treasury wallet on Arc Testnet.
 * Returns addresses the operator can hand to faucet.circle.com to fund.
 */
export async function POST() {
  const status = circleConfigStatus();
  if (!status.ok) {
    return NextResponse.json(
      { ok: false, configured: false, reason: status.reason },
      { status: 503 },
    );
  }

  try {
    const venueIds = listVenues().map((v) => v.id);
    const result = await provisionArgoWallets(venueIds);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, configured: true, error: msg },
      { status: 500 },
    );
  }
}
