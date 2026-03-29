import { useEffect, useState, useRef } from "react";
import { getBrands, getCompetitive } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, card, badge, mono } from "../theme";

const PAGE = { background: C.void, minHeight: "100vh", padding: "44px 56px", animation: "fadeUp .35s ease both" };

export default function Competitive() {
  const [allBrands, setAllBrands] = useState([]);
  const [selected, setSelected]   = useState(["Nike", "Adidas", "Puma"]);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [bgRefreshing, setBgRefreshing] = useState(false);

  const cacheRef = useRef({});   // { "Nike,Adidas,Puma:48": data }

  useEffect(() => {
    getBrands().then(setAllBrands).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected.length === 0) return;
    const key = `${selected.join(",")}:48`;
    const cached = cacheRef.current[key];

    if (cached) {
      setData(cached);
      setLoading(false);
      // Background refresh
      setBgRefreshing(true);
      getCompetitive(selected, 48, { force: true })
        .then(d => { cacheRef.current[key] = d; setData(d); })
        .catch(() => {})
        .finally(() => setBgRefreshing(false));
      return;
    }

    setLoading(true);
    getCompetitive(selected, 48)
      .then(d => { cacheRef.current[key] = d; setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selected]);

  function toggle(brand) {
    setSelected(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : prev.length < 5 ? [...prev, brand] : prev
    );
  }

  const chartData = data
    ? Object.entries(data).map(([brand, m]) => ({
        brand,
        Positive: +(m.sentiment.positive * 100).toFixed(1),
        Neutral:  +(m.sentiment.neutral  * 100).toFixed(1),
        Negative: +(m.sentiment.negative * 100).toFixed(1),
      }))
    : [];

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 38, paddingBottom: 28, borderBottom: `1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: C.t1, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 5, height: 32, background: "linear-gradient(180deg,#f59e0b,#ef4444)", borderRadius: 3, boxShadow: "0 0 18px rgba(245,158,11,.8)" }} />
            Competitive Comparison
          </h1>
          <p style={mono(11, C.t3, { letterSpacing: ".12em", textTransform: "uppercase", marginTop: 10, marginLeft: 19 })}>
            Compare up to 5 brands side-by-side
            {bgRefreshing && <span style={{ marginLeft: 12, color: C.t4 }}>↻ refreshing…</span>}
          </p>
        </div>
        <span style={badge(C.t3)}>GET /competitive</span>
      </div>

      {/* Brand selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {(allBrands.length ? allBrands : ["Nike", "Adidas", "Puma", "Reebok"]).map(b => (
          <button key={b} onClick={() => toggle(b)} style={{
            padding: "8px 18px", borderRadius: 8,
            border: `1px solid ${selected.includes(b) ? C.bGlow : C.bDim}`,
            background: selected.includes(b) ? "rgba(56,189,248,0.1)" : "transparent",
            color: selected.includes(b) ? C.cyan : C.t3,
            fontFamily: C.sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>{b} {selected.includes(b) ? "✓" : ""}</button>
        ))}
        <span style={mono(10, C.t4, { alignSelf: "center", marginLeft: 8 })}>
          {selected.length}/5 selected
        </span>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 360, background: C.card, borderRadius: 16, border: `1px solid ${C.bDim}`, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Grouped bar chart */}
          <div style={{ ...card(), marginBottom: 24 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.4),transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.neu, boxShadow: `0 0 12px ${C.neu}` }} />
              <span style={mono(11, C.t2, { letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 })}>
                Sentiment Distribution by Brand
              </span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barCategoryGap="25%">
                <XAxis dataKey="brand" tick={{ fill: C.t3, fontFamily: "'Space Mono',monospace", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.t4, fontFamily: "'Space Mono',monospace", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ background: C.card, border: `1px solid ${C.bDim}`, borderRadius: 10, fontFamily: "'Space Mono',monospace", fontSize: 12 }}
                  labelStyle={{ color: C.t1, fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: C.t2 }} />
                <Bar dataKey="Positive" fill={C.pos} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Neutral"  fill={C.neu} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Negative" fill={C.neg} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div style={{ ...card({ padding: 0, overflow: "auto" }) }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.sans, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.bDim}` }}>
                  {["Brand", "Posts", "Positive%", "Neutral%", "Negative%", "Top Emotion", "Top Topic"].map(h => (
                    <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontFamily: C.mono, fontSize: 10, color: C.t3, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(data).map(([brand, m]) => (
                  <tr key={brand} style={{ borderBottom: `1px solid ${C.bDim}22` }}>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: C.t1 }}>{brand}</td>
                    <td style={{ padding: "14px 18px", color: C.t2, fontFamily: C.mono, fontSize: 12 }}>{m.total_posts}</td>
                    <td style={{ padding: "14px 18px", color: C.pos, fontFamily: C.mono, fontSize: 12 }}>{(m.sentiment.positive * 100).toFixed(1)}%</td>
                    <td style={{ padding: "14px 18px", color: C.neu, fontFamily: C.mono, fontSize: 12 }}>{(m.sentiment.neutral  * 100).toFixed(1)}%</td>
                    <td style={{ padding: "14px 18px", color: C.neg, fontFamily: C.mono, fontSize: 12 }}>{(m.sentiment.negative * 100).toFixed(1)}%</td>
                    <td style={{ padding: "14px 18px", color: C.violet, fontFamily: C.mono, fontSize: 12, textTransform: "capitalize" }}>
                      {m.top_emotions?.[0]?.[0] || "—"}
                    </td>
                    <td style={{ padding: "14px 18px", color: C.cyan, fontFamily: C.mono, fontSize: 12 }}>
                      {m.top_topics?.[0] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
