import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { C } from "../theme";

const API = "http://127.0.0.1:8000";

const LINKS = [
  { to: "/", label: "Dashboard", n: "01" },
  { to: "/analyze", label: "Text Analysis", n: "02" },
  { to: "/csv-upload", label: "CSV Upload", n: "03" },
  { to: "/competitive", label: "Compare", n: "04" },
  { to: "/alerts", label: "Alerts", n: "05" },
  { to: "/live-news", label: "Live News", n: "06" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const poll = () => axios.get(`${API}/alerts`).then(r => setAlertCount(r.data.alerts?.length || 0)).catch(() => { });
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 52px", height: "68px",
      background: "rgba(3,11,21,0.97)",
      borderBottom: `1px solid ${C.bDim}`,
      backdropFilter: "blur(20px)",
      position: "sticky", top: 0, zIndex: 999,
      boxShadow: "0 4px 48px rgba(0,0,0,0.7)",
    }}>

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px",
          background: "rgba(56,189,248,0.1)", border: `1px solid ${C.bGlow}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "18px", height: "18px", borderRadius: "5px",
            background: "linear-gradient(135deg,#38bdf8,#4f8ef7)",
            transform: "rotate(12deg)",
            boxShadow: "0 0 18px rgba(56,189,248,0.7)",
          }} />
        </div>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: "15px", fontWeight: "700", color: C.t1, letterSpacing: "-.01em" }}>
            Brand Sentinel
          </div>
          <div style={{ fontFamily: C.mono, fontSize: "9px", color: C.t4, letterSpacing: ".13em", textTransform: "uppercase", marginTop: "1px" }}>
            Sentiment Intelligence Platform
          </div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "6px" }}>
        {LINKS.map(({ to, label, n }) => {
          const active = pathname === to;
          const isAlerts = to === "/alerts";
          return (
            <Link key={to} to={to} className="nav-link" style={{
              position: "relative",
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 18px", borderRadius: "8px",
              color: active ? C.cyan : C.t3,
              background: active ? "rgba(56,189,248,0.09)" : "transparent",
              fontFamily: C.sans, fontSize: "14px", fontWeight: "500",
              transition: "all .15s", textDecoration: "none",
            }}>
              <span style={{ fontFamily: C.mono, fontSize: "9px", color: C.t4, letterSpacing: ".04em" }}>{n}</span>
              {label}
              {isAlerts && alertCount > 0 && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", background: C.neg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.mono, fontSize: 8, fontWeight: 700, color: "#fff",
                }}>{alertCount}</span>
              )}
              {active && (
                <div style={{
                  position: "absolute", bottom: "-1px", left: "14px", right: "14px",
                  height: "2px",
                  background: "linear-gradient(90deg,transparent,#38bdf8,transparent)",
                  boxShadow: "0 0 12px rgba(56,189,248,0.6)",
                  borderRadius: "1px",
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* Status */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "7px 16px", borderRadius: "20px",
        background: "rgba(14,245,160,0.07)", border: "1px solid rgba(14,245,160,0.22)",
      }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: C.pos, boxShadow: `0 0 10px ${C.pos}`,
          animation: "glowPulse 2.2s ease-in-out infinite",
        }} />
        <span style={{ fontFamily: C.mono, fontSize: "10px", fontWeight: "700", color: C.pos, letterSpacing: ".15em" }}>
          LIVE
        </span>
      </div>
    </nav>
  );
}