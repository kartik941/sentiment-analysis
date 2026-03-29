import { useEffect, useState } from "react";
import { getAlerts, resolveAlert } from "../services/api";
import { C, card, badge, mono } from "../theme";

const PAGE = { background: C.void, minHeight: "100vh", padding: "44px 56px", animation: "fadeUp .35s ease both" };

const SEV = {
  HIGH:   { color: C.neg,      bg: "rgba(255,77,112,0.08)",    border: C.neg      },
  MEDIUM: { color: "#f59e0b",  bg: "rgba(245,158,11,0.08)",    border: "#f59e0b"  },
  LOW:    { color: C.neu,      bg: "rgba(245,200,66,0.08)",    border: C.neu      },
};

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);

  function fetchAlerts(force = false) {
    getAlerts({ force })
      .then(a => { setAlerts(a); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(() => fetchAlerts(true), 60_000);
    return () => clearInterval(id);
  }, []);

  async function handleResolve(alertId) {
    setResolving(alertId);
    try {
      await resolveAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch { /* silent */ }
    finally { setResolving(null); }
  }

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 38, paddingBottom: 28, borderBottom: `1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: C.t1, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 5, height: 32, background: `linear-gradient(180deg,${C.neg},#e11d48)`, borderRadius: 3, boxShadow: `0 0 18px ${C.neg}99` }} />
            Crisis Alerts
          </h1>
          <p style={mono(11, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginTop: 10, marginLeft: 19 })}>
            Real-time monitoring · polling every 60s
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => fetchAlerts(true)} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.bDim}`,
            background: "transparent", color: C.t3, fontFamily: C.mono, fontSize: 10,
            cursor: "pointer", letterSpacing: ".08em",
          }}>↻ Refresh</button>
          <span style={badge(alerts.length === 0 ? C.pos : C.neg)}>
            {alerts.length === 0 ? "● ALL CLEAR" : `● ${alerts.length} ACTIVE`}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: C.cyan, fontFamily: C.mono, fontSize: 14 }}>
          Scanning for alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div style={card({ textAlign: "center", padding: "60px 30px" })}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.pos}44,transparent)` }} />
          <div style={{ fontSize: 52, opacity: .15, lineHeight: 1 }}>◎</div>
          <div style={mono(12, C.t3, { marginTop: 16, letterSpacing: ".12em", textTransform: "uppercase" })}>
            No alerts detected
          </div>
          <p style={{ fontFamily: C.sans, fontSize: 14, color: C.t3, marginTop: 12, lineHeight: 1.75 }}>
            All brand sentiment metrics are within normal thresholds.<br />
            Alerts will appear here immediately when anomalies are detected.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {alerts.map(a => {
            const s = SEV[a.severity] || SEV.LOW;
            const isResolving = resolving === a.id;
            return (
              <div key={a.id} style={{
                ...card({ padding: "20px 24px" }),
                borderLeft: `4px solid ${s.border}`,
                background: s.bg,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ ...badge(s.color), fontSize: 10 }}>{a.severity}</span>
                    <span style={{ fontFamily: C.sans, fontSize: 15, fontWeight: 600, color: C.t1 }}>{a.brand}</span>
                  </div>
                  <button onClick={() => handleResolve(a.id)} disabled={isResolving} style={{
                    padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.bDim}`,
                    background: "rgba(14,245,160,0.06)", color: C.pos,
                    fontFamily: C.mono, fontSize: 10, fontWeight: 700, cursor: isResolving ? "not-allowed" : "pointer",
                    letterSpacing: ".08em", textTransform: "uppercase", opacity: isResolving ? 0.5 : 1,
                  }}>{isResolving ? "Resolving…" : "✓ Mark Resolved"}</button>
                </div>
                <p style={{ fontFamily: C.sans, fontSize: 13, color: C.t2, marginTop: 10, lineHeight: 1.6 }}>
                  {a.reason}
                </p>
                <span style={mono(10, C.t4, { marginTop: 8, display: "block" })}>
                  Triggered: {new Date(a.triggered_at).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
