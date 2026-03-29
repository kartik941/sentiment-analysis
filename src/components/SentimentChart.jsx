import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C } from "../theme";

const FALLBACK = [
  { name: "Positive", value: 52, fill: "#0ef5a0" },
  { name: "Neutral", value: 25.6, fill: "#f5c842" },
  { name: "Negative", value: 22.4, fill: "#ff4d70" },
];

const R = Math.PI / 180;

function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      textAnchor="middle" dominantBaseline="central"
      fill="#030b15"
      style={{ fontFamily: "'Space Mono',monospace", fontSize: "13px", fontWeight: "700" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{
      background: "#0c1d30", border: `1px solid ${p.payload.fill}55`,
      borderLeft: `3px solid ${p.payload.fill}`,
      borderRadius: "10px", padding: "16px 20px",
      boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 24px ${p.payload.fill}22`,
    }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", letterSpacing: ".12em", color: "#3d6080", marginBottom: "6px", textTransform: "uppercase" }}>
        {p.name}
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "30px", fontWeight: "700", color: p.payload.fill, textShadow: `0 0 20px ${p.payload.fill}77` }}>
        {p.value.toFixed(1)}%
      </div>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "36px", marginTop: "24px" }}>
      {payload.map((e) => (
        <div key={e.value} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: e.color, boxShadow: `0 0 12px ${e.color}` }} />
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "12px", color: "#7fb5d5", letterSpacing: ".04em" }}>
            {e.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SentimentChart({ sentimentData }) {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    if (sentimentData) {
      setData([
        { name: "Positive", value: sentimentData.positive * 100, fill: "#0ef5a0" },
        { name: "Neutral", value: sentimentData.neutral * 100, fill: "#f5c842" },
        { name: "Negative", value: sentimentData.negative * 100, fill: "#ff4d70" },
      ]);
    }
  }, [sentimentData]);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie
          data={data} dataKey="value"
          cx="50%" cy="46%"
          outerRadius={140} innerRadius={70}
          paddingAngle={3} strokeWidth={0}
          labelLine={false} label={PctLabel}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} style={{ filter: `drop-shadow(0 0 10px ${d.fill}66)` }} />
          ))}
        </Pie>
        <Tooltip content={<Tip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}