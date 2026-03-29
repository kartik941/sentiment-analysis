// Shared design tokens — import in every page/component
export const C = {
  void:    "#030b15",
  base:    "#060e1c",
  surface: "#091525",
  card:    "#0c1d30",
  raised:  "#102438",
  hover:   "#152d42",

  cyan:    "#38bdf8",
  blue:    "#4f8ef7",
  violet:  "#818cf8",

  pos:     "#0ef5a0",
  neu:     "#f5c842",
  neg:     "#ff4d70",

  t1:      "#eaf4ff",
  t2:      "#7fb5d5",
  t3:      "#3d6080",
  t4:      "#203850",

  bDim:    "rgba(28,78,138,0.28)",
  bGlow:   "rgba(56,189,248,0.38)",
  bAccent: "rgba(56,189,248,0.65)",

  mono:    "'Space Mono', monospace",
  sans:    "'DM Sans', sans-serif",
};

export const card = (extra = {}) => ({
  background: C.card,
  border: `1px solid ${C.bDim}`,
  borderRadius: "16px",
  padding: "32px 36px",
  position: "relative",
  overflow: "hidden",
  ...extra,
});

export const badge = (color, bg) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "5px 14px",
  borderRadius: "20px",
  fontFamily: C.mono,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color,
  background: bg || `${color}18`,
  border: `1px solid ${color}40`,
});

export const mono = (size = 12, color, extra = {}) => ({
  fontFamily: C.mono,
  fontSize: `${size}px`,
  color: color || C.t2,
  ...extra,
});