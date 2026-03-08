import SentimentChart from "../components/SentimentChart";
import { C, card, badge, mono } from "../theme";

const STATS = [
  { label:"Total Posts", value:"1,250", color: C.cyan,   meta:"last 30 days",   icon:"◈", glow:"rgba(56,189,248,0.15)"  },
  { label:"Positive",    value:"650",   color: C.pos,    meta:"52.0% of total", icon:"▲", glow:"rgba(14,245,160,0.15)"  },
  { label:"Neutral",     value:"320",   color: C.neu,    meta:"25.6% of total", icon:"◆", glow:"rgba(245,200,66,0.15)"  },
  { label:"Negative",    value:"280",   color: C.neg,    meta:"22.4% of total", icon:"▼", glow:"rgba(255,77,112,0.15)"  },
];

const PAGE = {
  background: C.void, minHeight: "100vh",
  padding: "44px 56px", animation: "fadeUp .35s ease both",
};

export default function Dashboard() {
  return (
    <div style={PAGE}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"38px", paddingBottom:"28px", borderBottom:`1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily:C.mono, fontSize:"28px", fontWeight:"700", color:C.t1, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:"14px" }}>
            <span style={{ display:"block", width:"5px", height:"32px", background:"linear-gradient(180deg,#38bdf8,#4f8ef7)", borderRadius:"3px", boxShadow:"0 0 18px rgba(56,189,248,.8)", flexShrink:0 }} />
            Brand Sentiment Dashboard
          </h1>
          <p style={{ fontFamily:C.mono, fontSize:"11px", letterSpacing:".12em", textTransform:"uppercase", color:C.t3, marginTop:"10px", marginLeft:"19px" }}>
            Real-time sentiment intelligence · Nike
          </p>
        </div>
        <div style={{ display:"flex", gap:"10px", alignItems:"center", paddingTop:"4px" }}>
          <span style={badge(C.t3)}> BRAND: NIKE </span>
          <span style={badge(C.pos)}> ● LIVE </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" }}>
        {STATS.map(({ label, value, color, meta, icon, glow }) => (
          <div key={label} className="stat-card" style={{
            background: C.card, border:`1px solid ${C.bDim}`,
            borderRadius:"16px", padding:"28px 26px",
            position:"relative", overflow:"hidden",
            transition:"all .2s", cursor:"default",
            borderTop:`2px solid ${color}`,
            boxShadow:`0 4px 24px rgba(0,0,0,0.4)`,
          }}>
            {/* Glow blob */}
            <div style={{ position:"absolute", top:0, right:0, width:"110px", height:"110px", background:glow, borderRadius:"50%", filter:"blur(30px)", pointerEvents:"none" }} />

            <div style={{ fontFamily:C.mono, fontSize:"10px", letterSpacing:".14em", textTransform:"uppercase", color:C.t3, marginBottom:"18px" }}>
              {label}
            </div>

            <div style={{ fontFamily:C.mono, fontSize:"42px", fontWeight:"700", color, letterSpacing:"-.04em", lineHeight:1, textShadow:`0 0 28px ${color}55` }}>
              {value}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:"7px", marginTop:"14px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}` }} />
              <span style={{ fontFamily:C.mono, fontSize:"11px", color:C.t3 }}>{meta}</span>
            </div>

            {/* Big bg icon */}
            <div style={{ position:"absolute", bottom:"10px", right:"18px", fontFamily:C.mono, fontSize:"64px", color, opacity:.05, lineHeight:1, pointerEvents:"none" }}>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart Card ── */}
      <div style={{ ...card(), boxShadow:"0 8px 48px rgba(0,0,0,0.5)" }}>
        {/* subtle top glow */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.4),transparent)" }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.pos, boxShadow:`0 0 12px ${C.pos}`, animation:"glowPulse 2.2s ease-in-out infinite" }} />
            <span style={mono(12, C.t2, { letterSpacing:".1em", textTransform:"uppercase", fontWeight:"700" })}>
              Sentiment Distribution
            </span>
          </div>
          <span style={badge(C.pos)}>LIVE DATA</span>
        </div>

        <SentimentChart />
      </div>

    </div>
  );
}