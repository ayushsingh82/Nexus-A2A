import { NextResponse } from "next/server";
import { getTreasury } from "@/graph/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ treasury: getTreasury() });
}
