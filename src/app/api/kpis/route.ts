import { NextResponse } from "next/server";
import { getKpis } from "@/graph/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ kpis: getKpis() });
}
