"use client";

import { useState } from "react";
import type { AskAnswer } from "@/graph/ask";

const EXAMPLES = [
  "What is the best cycle right now?",
  "Is there a cycle through ETH?",
  "Show me the treasury",
  "How does Argo find arbitrage?",
  "Why are there no opportunities?",
  "How fast does it settle on Arc?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(e?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { answer: AskAnswer };
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: 900 }}>
      {/* prompt card */}
      <section className="card" style={{ padding: 22 }}>
        <div className="section-title">Ask the swarm</div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>
          Ask anything — answers are computed live from the swarm&apos;s real state (edges,
          cycles, treasury, receipts). Nothing is canned, and there are no fixed questions.
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. which venue has the best ETH quote? or anything else…"
            autoFocus
            style={{
              flex: 1,
              minWidth: 240,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              fontSize: 14,
              fontFamily: "var(--font-geist-sans)",
              background: "var(--bg-base)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !question.trim()}
            style={{ padding: "12px 20px", fontSize: 14, opacity: loading || !question.trim() ? 0.6 : 1 }}
          >
            {loading ? "Reading the graph…" : "Ask →"}
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuestion(ex);
                ask(ex);
              }}
              style={exampleChipStyle}
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 14, fontSize: 13, color: "var(--red)" }}>{error}</div>
        )}
      </section>

      {/* answer */}
      {answer && (
        <section className="card" style={{ padding: 24, marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            You asked
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18, fontStyle: "italic" }}>
            “{answer.question}”
          </div>

          <p style={{ fontSize: 17, lineHeight: 1.5, color: "var(--text-primary)", margin: 0 }}>
            {answer.thesis}
          </p>

          {answer.points.length > 0 && (
            <ul style={{ margin: "18px 0 0", paddingLeft: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {answer.points.map((p, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--brand-green)", flexShrink: 0, fontWeight: 700 }}>▸</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}

          {answer.evidence.length > 0 && (
            <>
              <div className="nav-section-label" style={{ padding: 0, margin: "22px 0 10px" }}>
                Grounded in
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {answer.evidence.map((e) => (
                  <div
                    key={e.label}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "8px 12px",
                      background: "var(--bg-surface)",
                      minWidth: 96,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {e.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-geist-mono)", color: "var(--text-primary)", marginTop: 2 }}>
                      {e.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {answer.related.length > 0 && (
            <>
              <div className="nav-section-label" style={{ padding: 0, margin: "22px 0 10px" }}>
                Ask next
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {answer.related.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setQuestion(r);
                      ask(r);
                    }}
                    style={exampleChipStyle}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 18, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
            answered from live state · {new Date(answer.asOfMs).toLocaleTimeString()}
          </div>
        </section>
      )}
    </div>
  );
}

const exampleChipStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid var(--border-strong)",
  background: "var(--bg-surface)",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontFamily: "var(--font-geist-sans)",
};
