import { C, card, badge, mono } from "../theme";

const PAGE = { background:C.void, minHeight:"100vh", padding:"44px 56px", animation:"fadeUp .35s ease both" };

const MONITORS = [
  { name:"Negative Spike",     ok:true  },
  { name:"Sentiment Drop",     ok:true  },
  { name:"Volume Surge",       ok:true  },
  { name:"Competitor Mention", ok:true  },
];

const THRESHOLDS = [
  { label:"Negative Sentiment", current:22, max:37, color:C.neg  },
  { label:"Sentiment Velocity", current:8,  max:25, color:C.neu  },
  { label:"Volume Anomaly",     current:11, max:40, color:C.violet},
  { label:"Competitor Overlap", current:5,  max:30, color:C.cyan  },
];

const CONFIG = [
  { label:"Alert Threshold",  value:"> 15% Negative Spike" },
  { label:"Window",           value:"Rolling 24h"          },
  { label:"Response SLA",     value:"< 5 minutes"          },
  { label:"Brands Tracked",   value:"Nike, Adidas, Puma"   },
];

export default function Alerts() {
  return (
    <div style={PAGE}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"38px", paddingBottom:"28px", borderBottom:`1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily:C.mono, fontSize:"28px", fontWeight:"700", color:C.t1, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:"14px" }}>
            <span style={{ display:"block", width:"5px", height:"32px", background:`linear-gradient(180deg,${C.neg},#e11d48)`, borderRadius:"3px", boxShadow:`0 0 18px ${C.neg}99`, flexShrink:0 }} />
            Crisis Alerts
          </h1>
          <p style={{ fontFamily:C.mono, fontSize:"11px", letterSpacing:".12em", textTransform:"uppercase", color:C.t3, marginTop:"10px", marginLeft:"19px" }}>
            Anomaly detection · threshold monitoring
          </p>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <span style={badge(C.pos)}>● ALL CLEAR</span>
          <span style={badge(C.t3)}>0 ACTIVE</span>
        </div>
      </div>

      {/* ── Monitor status row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
        {MONITORS.map(({ name, ok }) => (
          <div key={name} className="monitor-item" style={{
            background:C.card, border:`1px solid ${C.bDim}`,
            borderRadius:"12px", padding:"20px 22px",
            display:"flex", alignItems:"center", gap:"12px",
            transition:"border-color .2s",
          }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.pos, boxShadow:`0 0 10px ${C.pos}`, flexShrink:0, animation:"glowPulse 2.5s ease-in-out infinite" }} />
            <span style={{ fontFamily:C.sans, fontSize:"13px", fontWeight:"500", color:C.t2, flex:1 }}>{name}</span>
            <span style={{ fontFamily:C.mono, fontSize:"10px", color:C.pos, letterSpacing:".07em" }}>OK</span>
          </div>
        ))}
      </div>

      {/* ── Active alerts (empty) ── */}
      <div style={{ ...card(), marginBottom:"24px" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:`linear-gradient(90deg,transparent,${C.neg}44,transparent)` }} />

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.pos, boxShadow:`0 0 12px ${C.pos}`, animation:"glowPulse 2.2s ease-in-out infinite" }} />
            <span style={mono(11, C.t2, { letterSpacing:".1em", textTransform:"uppercase", fontWeight:"700" })}>Active Alerts</span>
          </div>
          <span style={badge(C.pos)}>MONITORING</span>
        </div>

        {/* Empty */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 20px 38px", gap:"12px" }}>
          <div style={{ fontSize:"52px", opacity:.15, lineHeight:1 }}>◎</div>
          <div style={mono(12, C.t3, { letterSpacing:".12em", textTransform:"uppercase" })}>No alerts detected</div>
          <p style={{ fontFamily:C.sans, fontSize:"14px", color:C.t3, textAlign:"center", maxWidth:"380px", lineHeight:1.75 }}>
            All brand sentiment metrics are within normal thresholds.<br/>Alerts will appear here immediately when anomalies are detected.
          </p>
        </div>

        {/* Threshold bars */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px", marginTop:"16px" }}>
          {THRESHOLDS.map(({ label, current, max, color }) => {
            const pct = (current / max) * 100;
            return (
              <div key={label} style={{ background:C.raised, border:`1px solid ${C.bDim}`, borderRadius:"12px", padding:"22px 24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"14px" }}>
                  <span style={mono(10, C.t3, { letterSpacing:".1em", textTransform:"uppercase" })}>{label}</span>
                  <span style={{ fontFamily:C.mono, fontSize:"11px", color, fontWeight:"700" }}>{current}% / {max}%</span>
                </div>
                {/* Track */}
                <div style={{ position:"relative", height:"7px", background:C.void, borderRadius:"4px", overflow:"visible" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:"4px", boxShadow:`0 0 12px ${color}55`, transition:"width .8s ease" }} />
                  {/* Threshold marker */}
                  <div style={{ position:"absolute", top:"-5px", right:"0", width:"2px", height:"17px", background:`${color}cc`, borderRadius:"1px", boxShadow:`0 0 8px ${color}` }} />
                </div>
                <div style={mono(9, C.t3, { marginTop:"9px", letterSpacing:".08em" })}>
                  THRESHOLD AT {max}% &nbsp;·&nbsp; CURRENT: {current}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Config grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px" }}>
        {CONFIG.map(({ label, value }, i) => {
          const colors = [C.cyan, C.violet, C.neu, C.pos];
          return (
            <div key={label} className="config-box" style={{
              background:C.card, border:`1px solid ${C.bDim}`,
              borderTop:`2px solid ${colors[i]}`,
              borderRadius:"12px", padding:"22px 24px",
              transition:"border-color .2s",
            }}>
              <div style={mono(9, C.t3, { letterSpacing:".12em", textTransform:"uppercase", marginBottom:"9px" })}>{label}</div>
              <div style={{ fontFamily:C.sans, fontSize:"14px", fontWeight:"600", color:C.t2 }}>{value}</div>
            </div>
          );
        })}
      </div>

    </div>
  );
}