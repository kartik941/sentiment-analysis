import { useState } from "react";
import axios from "axios";
import { C, card, badge, mono } from "../theme";

const PAGE = { background:C.void, minHeight:"100vh", padding:"44px 56px", animation:"fadeUp .35s ease both" };

export default function TextAnalysis() {
  const [text, setText]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await axios.post("http://127.0.0.1:8000/predict", { text });
      setResult(r.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  const sentColor = { positive: C.pos, neutral: C.neu, negative: C.neg }[result?.sentiment?.toLowerCase()] ?? C.cyan;

  return (
    <div style={PAGE}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"38px", paddingBottom:"28px", borderBottom:`1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily:C.mono, fontSize:"28px", fontWeight:"700", color:C.t1, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:"14px" }}>
            <span style={{ display:"block", width:"5px", height:"32px", background:"linear-gradient(180deg,#38bdf8,#818cf8)", borderRadius:"3px", boxShadow:"0 0 18px rgba(56,189,248,.8)", flexShrink:0 }} />
            Text Sentiment Analysis
          </h1>
          <p style={{ fontFamily:C.mono, fontSize:"11px", letterSpacing:".12em", textTransform:"uppercase", color:C.t3, marginTop:"10px", marginLeft:"19px" }}>
            NLP classification engine · real-time
          </p>
        </div>
        <span style={badge(C.cyan)}>● MODEL READY</span>
      </div>

      {/* ── Two columns ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px" }}>

        {/* LEFT: Input */}
        <div style={card()}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.35),transparent)" }} />

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.cyan, boxShadow:`0 0 12px ${C.cyan}`, animation:"glowPulse 2.2s ease-in-out infinite" }} />
              <span style={mono(11, C.t2, { letterSpacing:".1em", textTransform:"uppercase", fontWeight:"700" })}>Input Text</span>
            </div>
            <span style={mono(11, C.t3)}>{text.length} chars</span>
          </div>

          <textarea
            rows={9}
            placeholder="Paste a brand mention, tweet, review, or social post here to analyze its sentiment..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width:"100%", display:"block",
              background: C.raised, border:`1px solid ${C.bDim}`,
              borderRadius:"10px", padding:"18px 20px",
              color:C.t1, fontSize:"15px", lineHeight:1.75,
              resize:"vertical", outline:"none",
              transition:"border-color .2s",
            }}
            onFocus={e => e.target.style.borderColor = C.bAccent}
            onBlur={e  => e.target.style.borderColor = C.bDim}
          />

          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap", marginTop:"20px" }}>
            <button
              className="btn-primary"
              disabled={loading || !text.trim()}
              onClick={analyze}
              style={{
                display:"inline-flex", alignItems:"center", gap:"9px",
                padding:"13px 28px", borderRadius:"10px",
                background:"rgba(56,189,248,0.12)", border:`1px solid rgba(56,189,248,0.45)`,
                color:C.cyan, fontFamily:C.mono, fontSize:"12px", fontWeight:"700",
                letterSpacing:".09em", textTransform:"uppercase",
                cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                opacity: loading || !text.trim() ? .5 : 1,
                transition:"all .2s",
              }}
            >
              {loading
                ? <><span style={{ width:"11px", height:"11px", borderRadius:"50%", border:"2px solid rgba(56,189,248,0.25)", borderTopColor:C.cyan, display:"inline-block", animation:"spin .6s linear infinite" }} /> Analyzing...</>
                : <>▶ &nbsp;Run Analysis</>
              }
            </button>

            {text && (
              <button
                className="btn-danger"
                onClick={() => { setText(""); setResult(null); }}
                style={{
                  display:"inline-flex", alignItems:"center", gap:"7px",
                  padding:"13px 22px", borderRadius:"10px",
                  background:"transparent", border:`1px solid rgba(255,77,100,0.35)`,
                  color:C.neg, fontFamily:C.mono, fontSize:"12px", fontWeight:"700",
                  letterSpacing:".08em", textTransform:"uppercase", cursor:"pointer",
                  transition:"all .2s",
                }}
              >✕ Clear</button>
            )}
          </div>
        </div>

        {/* RIGHT: Result */}
        <div style={card()}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.35),transparent)" }} />

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.violet, boxShadow:`0 0 12px ${C.violet}`, animation:"glowPulse 2.5s ease-in-out infinite" }} />
              <span style={mono(11, C.t2, { letterSpacing:".1em", textTransform:"uppercase", fontWeight:"700" })}>Analysis Result</span>
            </div>
            {result && <span style={mono(10, C.t3)}>{new Date().toLocaleTimeString()}</span>}
          </div>

          {!result ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"56px 20px", gap:"14px" }}>
              <div style={{ fontSize:"52px", opacity:.15, lineHeight:1 }}>⟁</div>
              <div style={mono(12, C.t3, { letterSpacing:".12em", textTransform:"uppercase" })}>Awaiting input</div>
              <p style={{ fontFamily:C.sans, fontSize:"14px", color:C.t3, textAlign:"center", maxWidth:"280px", lineHeight:1.7 }}>
                Enter text and click Run Analysis to see the sentiment breakdown here.
              </p>
            </div>
          ) : (
            <div style={{ animation:"fadeUp .3s ease both" }}>
              {/* Brand row */}
              <div style={{ padding:"16px 0", borderBottom:`1px solid ${C.bDim}`, display:"flex", alignItems:"center", gap:"16px" }}>
                <span style={mono(10, C.t3, { letterSpacing:".12em", textTransform:"uppercase", width:"90px", flexShrink:0 })}>Brand</span>
                <span style={{ fontFamily:C.mono, fontSize:"20px", fontWeight:"700", color:C.t1 }}>{result.brand}</span>
              </div>
              {/* Sentiment row */}
              <div style={{ padding:"16px 0", borderBottom:`1px solid ${C.bDim}`, display:"flex", alignItems:"center", gap:"16px" }}>
                <span style={mono(10, C.t3, { letterSpacing:".12em", textTransform:"uppercase", width:"90px", flexShrink:0 })}>Sentiment</span>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:"8px",
                  padding:"6px 18px", borderRadius:"20px",
                  background:`${sentColor}18`, border:`1px solid ${sentColor}44`,
                  fontFamily:C.mono, fontSize:"13px", fontWeight:"700",
                  color:sentColor, letterSpacing:".08em", textTransform:"uppercase",
                  boxShadow:`0 0 16px ${sentColor}22`,
                }}>
                  <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:sentColor, boxShadow:`0 0 8px ${sentColor}`, display:"inline-block" }} />
                  {result.sentiment}
                </span>
              </div>
              {/* Confidence */}
              {result.confidence !== undefined && (
                <div style={{ padding:"16px 0", display:"flex", alignItems:"center", gap:"16px" }}>
                  <span style={mono(10, C.t3, { letterSpacing:".12em", textTransform:"uppercase", width:"90px", flexShrink:0 })}>Confidence</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"14px", flex:1 }}>
                    <div style={{ flex:1, maxWidth:"200px", height:"6px", background:C.void, borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(result.confidence*100).toFixed(0)}%`, background:"linear-gradient(90deg,#4f8ef7,#38bdf8)", borderRadius:"3px", transition:"width .8s ease" }} />
                    </div>
                    <span style={{ fontFamily:C.mono, fontSize:"16px", fontWeight:"700", color:C.t1 }}>
                      {(result.confidence*100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}