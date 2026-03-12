import { useState } from "react";
import axios from "axios";
import { C, card, badge, mono } from "../theme";

const API = "http://127.0.0.1:8000";
const PAGE = { background: C.void, minHeight: "100vh", padding: "44px 56px", animation: "fadeUp .35s ease both" };

export default function TextAnalysis() {
  const [text, setText] = useState("");
  const [platform, setPlatform] = useState("reddit");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/predict`, { text, platform });
      setResult(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const sentColor = (l) => l === "positive" ? C.pos : l === "negative" ? C.neg : C.neu;

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 38, paddingBottom: 28, borderBottom: `1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: C.t1, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 5, height: 32, background: "linear-gradient(180deg,#818cf8,#4f8ef7)", borderRadius: 3, boxShadow: "0 0 18px rgba(129,140,248,.8)" }} />
            Manual Text Analysis
          </h1>
          <p style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.t3, marginTop: 10, marginLeft: 19 }}>
            Type or paste any post for instant AI analysis
          </p>
        </div>
        <span style={badge(C.violet)}>POST /predict</span>
      </div>

      {/* Input */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        <div style={card()}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(129,140,248,0.4),transparent)" }} />

          {/* Platform toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={mono(10, C.t3, { letterSpacing: ".1em", textTransform: "uppercase" })}>Platform:</span>
            {["reddit", "news"].map(p => (
              <button key={p} onClick={() => setPlatform(p)} style={{
                padding: "6px 16px", borderRadius: 6, border: `1px solid ${platform === p ? C.bGlow : C.bDim}`,
                background: platform === p ? "rgba(56,189,248,0.1)" : "transparent",
                color: platform === p ? C.cyan : C.t3, fontFamily: C.mono, fontSize: 11,
                fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              }}>{p}</button>
            ))}
          </div>

          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Type or paste a post here..."
            style={{
              width: "100%", minHeight: 140, padding: 20, borderRadius: 12,
              background: C.raised, border: `1px solid ${C.bDim}`, color: C.t1,
              fontFamily: C.sans, fontSize: 14, lineHeight: 1.7, resize: "vertical",
              outline: "none",
            }} />

          <button onClick={analyze} disabled={loading || !text.trim()} style={{
            marginTop: 16, padding: "13px 28px", borderRadius: 10,
            background: "rgba(129,140,248,0.12)", border: `1px solid rgba(129,140,248,0.45)`,
            color: C.violet, fontFamily: C.mono, fontSize: 12, fontWeight: 700,
            letterSpacing: ".09em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
          }}>
            {loading ? "Analysing..." : "▶  Analyse"}
          </button>
        </div>

        {/* Result panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!result && !loading && (
            <div style={{ ...card({ padding: "60px 30px", textAlign: "center" }) }}>
              <div style={{ fontSize: 48, opacity: .12, lineHeight: 1 }}>◎</div>
              <div style={mono(12, C.t3, { marginTop: 16, letterSpacing: ".1em", textTransform: "uppercase" })}>
                Submit text to see results
              </div>
            </div>
          )}

          {loading && (
            <div style={{ ...card({ padding: "60px 30px", textAlign: "center" }) }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${C.bDim}`, borderTopColor: C.violet, borderRadius: "50%", animation: "spin .6s linear infinite", margin: "0 auto 16px" }} />
              <div style={mono(12, C.t3, { letterSpacing: ".1em", textTransform: "uppercase" })}>Processing with ML pipeline...</div>
            </div>
          )}

          {result && (
            <>
              {/* Overall sentiment */}
              <div style={{ ...card({ padding: "20px 24px" }), borderLeft: `3px solid ${sentColor(result.overall.label)}` }}>
                <div style={mono(9, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 })}>Overall Sentiment</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ ...badge(sentColor(result.overall.label)), fontSize: 13, padding: "8px 20px" }}>
                    {result.overall.label.toUpperCase()}
                  </span>
                  <span style={mono(12, C.t2)}>
                    Confidence: {(result.overall.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Sarcasm badge */}
              {result.overall.is_sarcastic && (
                <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(245,200,66,0.08)", border: `1px solid rgba(245,200,66,0.3)`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠</span>
                  <span style={{ fontFamily: C.sans, fontSize: 13, color: C.neu, fontWeight: 600 }}>
                    Sarcasm detected — sentiment has been corrected
                  </span>
                  <span style={mono(10, C.t3, { marginLeft: "auto" })}>
                    Score: {(result.overall.sarcasm_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Crisis banner */}
              {result.crisis?.crisis_flag && (
                <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(255,77,112,0.08)", border: `1px solid rgba(255,77,112,0.3)`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🚨</span>
                  <span style={{ fontFamily: C.sans, fontSize: 13, color: C.neg, fontWeight: 600 }}>
                    Crisis Alert — Severity: {result.crisis.severity || "Unknown"}
                  </span>
                </div>
              )}

              {/* No-brand warning */}
              {result.brands.length === 0 && (
                <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(245,200,66,0.06)", border: `1px solid rgba(245,200,66,0.25)`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>ℹ</span>
                  <span style={{ fontFamily: C.sans, fontSize: 13, color: C.neu }}>
                    No brand detected in this post
                  </span>
                </div>
              )}

              {/* Brand cards */}
              {result.brands.length > 0 && (
                <div style={card({ padding: "18px 22px" })}>
                  <div style={mono(9, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 12 })}>Detected Brands</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {result.brands.map((b, i) => (
                      <div key={i} style={{ padding: "10px 16px", borderRadius: 10, background: C.raised, border: `1px solid ${C.bDim}`, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 600, color: C.t1 }}>{b.brand}</span>
                        <span style={{ ...badge(sentColor(b.sentiment)), fontSize: 9 }}>{b.sentiment}</span>
                        <span style={mono(9, C.t4)}>{b.method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotions — horizontal bars */}
              {result.emotions?.emotions && Object.keys(result.emotions.emotions).length > 0 && (
                <div style={card({ padding: "18px 22px" })}>
                  <div style={mono(9, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 14 })}>Emotions</div>
                  {Object.entries(result.emotions.emotions)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([emotion, score]) => (
                      <div key={emotion} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontFamily: C.sans, fontSize: 12, color: C.t2, textTransform: "capitalize" }}>{emotion}</span>
                          <span style={mono(10, C.t3)}>{(score * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, background: C.void, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${score * 100}%`, background: `linear-gradient(90deg,${C.violet}88,${C.violet})`, borderRadius: 3, transition: "width .5s" }} />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Topic tag */}
              {result.topic?.label && (
                <div style={card({ padding: "16px 22px" })}>
                  <div style={mono(9, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 })}>Topic</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ ...badge(C.cyan), fontSize: 11, padding: "6px 14px" }}>{result.topic.label}</span>
                    {(result.topic.keywords || []).map((kw, i) => (
                      <span key={i} style={{ fontFamily: C.mono, fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "rgba(56,189,248,0.06)", border: `1px solid ${C.bDim}`, color: C.t3 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}