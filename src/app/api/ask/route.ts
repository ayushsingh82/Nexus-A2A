import { NextResponse } from "next/server";
import { answerSwarm } from "@/graph/ask";

export const dynamic = "force-dynamic";

/**
 * POST /api/ask  { question: string }
 *
 * Open-ended Q&A. Any question is accepted; the answer is computed live from
 * the swarm's current state (never a fixed/canned response).
 */
export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body?.question === "string" ? body.question : "";
  } catch {
    /* fall through to empty-question guard */
  }

  if (!question.trim()) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  return NextResponse.json({ answer: answerSwarm(question) });
}
