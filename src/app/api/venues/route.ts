import { NextResponse } from "next/server";
import { listEdges, listVenues } from "@/graph/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    venues: listVenues(),
    edges: listEdges(),
  });
}
