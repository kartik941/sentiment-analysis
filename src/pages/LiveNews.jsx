import { useEffect, useState, useRef, useCallback } from "react";
import { getLiveNews, collectNews, invalidateCache } from "../services/api";
import { C, card, badge } from "../theme";

const BRANDS = ["Nike", "Adidas", "Puma", "Reebok"];
const PER_PAGE = 20;

const SENTIMENT_COLORS = {
  Positive: { color: C.pos, bg: "rgba(14,245,160,0.08)",  border: "rgba(14,245,160,0.3)"  },
  Negative: { color: C.neg, bg: "rgba(255,77,112,0.08)",  border: "rgba(255,77,112,0.3)"  },
  Neutral:  { color: C.neu, bg: "rgba(245,200,66,0.08)",  border: "rgba(245,200,66,0.3)"  },
  Unknown:  { color: C.t3,  bg: "rgba(61,96,128,0.08)",   border: "rgba(61,96,128,0.3)"   },
};

function SentimentBadge({ label }) {
  const s = SENTIMENT_COLORS[label] || SENTIMENT_COLORS.Unknown;
  return (
    <span style={{
      ...badge(s.color, s.bg),
      border: `1px solid ${s.border}`,
      fontSize: "9px",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {label}
    </span>
  );
}

function ArticleCard({ article }) {
  const pub = article.published
    ? new Date(article.published).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div
      style={{
        ...card({ padding: "20px 24px" }),
        display: "flex", flexDirection: "column", gap: "10px",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.bGlow;
        e.currentTarget.style.boxShadow = "0 4px 32px rgba(56,189,248,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `rgba(28,78,138,0.28)`;
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <a
          href={article.url} target="_blank" rel="noreferrer"
          style={{ fontFamily: C.sans, fontSize: "14px", fontWeight: 600, color: C.t1,
                   textDecoration: "none", lineHeight: "1.45", flex: 1 }}
        >
          {article.title || article.full_text?.slice(0, 90) + "…"}
        </a>
        <SentimentBadge label={article.sentiment} />
      </div>

      <p style={{ fontFamily: C.sans, fontSize: "12px", color: C.t3, lineHeight: 1.6, margin: 0 }}>
        {article.full_text?.slice(0, 220)}{article.full_text?.length > 220 ? "…" : ""}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: 2 }}>
        <span style={{ fontFamily: C.mono, fontSize: "10px", color: C.cyan }}>
          {article.source}
        </span>
        <span style={{ fontFamily: C.mono, fontSize: "10px", color: C.t4 }}>{pub}</span>
        {article.emotion && article.emotion !== "—" && (
          <span style={{ fontFamily: C.mono, fontSize: "10px", color: C.violet }}>
            ✦ {article.emotion}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontFamily: C.mono, fontSize: "10px", color: C.t3 }}>
          Conf: {article.score}%
        </span>
      </div>
    </div>
  );
}

// Skeleton card shown while loading — no blank screen
function SkeletonCard() {
  return (
    <div style={{ ...card({ padding: "20px 24px" }), display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 14, width: "70%", background: C.raised, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 12, width: "100%", background: C.raised, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 12, width: "85%", background: C.raised, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );
}

export default function LiveNews() {
  const [brand, setBrand]         = useState("Nike");
  const [page, setPage]           = useState(0);

  // Cache: keyed by brand+page so switching tabs never blanks the screen
  const cacheRef = useRef({});   // { "Nike:0": { articles, total }, ... }

  const cacheKey = `${brand}:${page}`;
  const cached   = cacheRef.current[cacheKey];

  const [articles, setArticles]   = useState(cached?.articles || []);
  const [total, setTotal]         = useState(cached?.total    || 0);
  const [loading, setLoading]     = useState(!cached);   // only show spinner on first load
  const [collecting, setCollecting] = useState(false);
  const [message, setMessage]     = useState("");
  const [bgRefreshing, setBgRefreshing] = useState(false);

  // ── Fetch — uses api.js cache first, then network ──────────────────────────
  const fetchNews = useCallback(async (b, p, { force = false } = {}) => {
    const key = `${b}:${p}`;
    const alreadyCached = !!cacheRef.current[key];

    if (alreadyCached && !force) {
      // Instant: show cached data, do background refresh silently
      setArticles(cacheRef.current[key].articles);
      setTotal(cacheRef.current[key].total);
      setLoading(false);

      setBgRefreshing(true);
      try {
        const data = await getLiveNews(b, PER_PAGE, p * PER_PAGE, { force: true });
        cacheRef.current[key] = { articles: data.articles || [], total: data.total || 0 };
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        if (data.message) setMessage(data.message);
      } catch { /* silent */ }
      finally { setBgRefreshing(false); }
      return;
    }

    // First time loading this brand/page — show skeleton
    if (!alreadyCached) setLoading(true);
    setMessage("");

    try {
      const data = await getLiveNews(b, PER_PAGE, p * PER_PAGE, { force });
      cacheRef.current[key] = { articles: data.articles || [], total: data.total || 0 };
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      if (data.message) setMessage(data.message);
    } catch {
      setMessage("Failed to reach backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Run on brand/page change
  useEffect(() => {
    fetchNews(brand, page);
  }, [brand, page, fetchNews]);

  // ── Collect Now ───────────────────────────────────────────────────────────
  const handleCollect = async () => {
    setCollecting(true);
    setMessage("Collecting live news… this may take 10–20 seconds.");
    try {
      const data = await collectNews(brand);
      if (data.status === "ok") {
        const count = data.summary?.[brand]?.news ?? 0;
        setMessage(`✅ Collected! ${count} new articles added for ${brand}.`);
        // Invalidate local cache for this brand, refetch page 0
        Object.keys(cacheRef.current)
          .filter(k => k.startsWith(brand))
          .forEach(k => delete cacheRef.current[k]);
        setPage(0);
        fetchNews(brand, 0, { force: true });
      } else {
        setMessage(`❌ ${data.message || "Collection failed."}`);
      }
    } catch {
      setMessage("❌ Collection failed. Check backend console.");
    } finally {
      setCollecting(false);
    }
  };

  // ── Brand tab switch — instant from cache ─────────────────────────────────
  const switchBrand = (b) => {
    setBrand(b);
    setPage(0);
    setMessage("");
    // Don't clear articles — show cached articles for new brand if available,
    // otherwise keep previous brand articles visible until new ones load
    const key = `${b}:0`;
    if (cacheRef.current[key]) {
      setArticles(cacheRef.current[key].articles);
      setTotal(cacheRef.current[key].total);
    }
  };

  const posCount = articles.filter(a => a.sentiment === "Positive").length;
  const negCount = articles.filter(a => a.sentiment === "Negative").length;
  const neuCount = articles.filter(a => a.sentiment === "Neutral").length;

  return (
    <div style={{ minHeight: "100vh", background: C.void, padding: "48px 52px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: C.mono, fontSize: "10px", color: C.cyan, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 8 }}>
          Live Feed · NewsAPI
          {bgRefreshing && (
            <span style={{ marginLeft: 16, color: C.t4 }}>↻ refreshing…</span>
          )}
        </div>
        <h1 style={{ fontFamily: C.sans, fontSize: "28px", fontWeight: 700, color: C.t1, margin: 0 }}>
          Live News Monitor
        </h1>
        <p style={{ fontFamily: C.sans, fontSize: "13px", color: C.t3, marginTop: 8 }}>
          Real-time brand news collected from 150,000+ sources, analysed by your ML pipeline.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {/* Brand tabs */}
        <div style={{ display: "flex", gap: 6, background: "rgba(9,21,37,0.8)", padding: "4px", borderRadius: 10, border: `1px solid ${C.bDim}` }}>
          {BRANDS.map(b => (
            <button key={b} onClick={() => switchBrand(b)}
              style={{
                padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: C.sans, fontSize: "13px", fontWeight: 600,
                background: brand === b ? "rgba(56,189,248,0.12)" : "transparent",
                color: brand === b ? C.cyan : C.t3,
                transition: "all .15s",
              }}>{b}</button>
          ))}
        </div>

        {/* Refresh */}
        <button onClick={() => fetchNews(brand, page, { force: true })} disabled={loading}
          style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${C.bDim}`,
            background: "transparent", color: C.t2, fontFamily: C.sans, fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
          {loading ? "Loading…" : "↺ Refresh"}
        </button>

        {/* Collect now */}
        <button onClick={handleCollect} disabled={collecting || loading}
          style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${C.bGlow}`,
            background: "rgba(56,189,248,0.08)", color: C.cyan, fontFamily: C.sans, fontSize: "13px",
            fontWeight: 600, cursor: collecting ? "not-allowed" : "pointer", opacity: collecting ? 0.6 : 1 }}>
          {collecting ? "Collecting…" : "⬇ Collect Now"}
        </button>

        <span style={{ fontFamily: C.mono, fontSize: "11px", color: C.t4, marginLeft: "auto" }}>
          {total} articles total
        </span>
      </div>

      {/* Message banner */}
      {message && (
        <div style={{ marginBottom: 20, padding: "12px 20px", borderRadius: 10,
          background: "rgba(56,189,248,0.06)", border: `1px solid ${C.bDim}`,
          fontFamily: C.sans, fontSize: "13px", color: C.t2 }}>
          {message}
        </div>
      )}

      {/* Summary stats — always visible if we have any articles */}
      {(articles.length > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Positive", count: posCount, color: C.pos },
            { label: "Negative", count: negCount, color: C.neg },
            { label: "Neutral",  count: neuCount, color: C.neu },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              flex: 1, padding: "14px 20px", borderRadius: 12,
              background: `${color}0a`, border: `1px solid ${color}30`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontFamily: C.mono, fontSize: "22px", fontWeight: 700, color }}>{count}</span>
              <span style={{ fontFamily: C.sans, fontSize: "12px", color: C.t3 }}>{label} on this page</span>
            </div>
          ))}
        </div>
      )}

      {/* Article list */}
      {loading ? (
        // Skeleton — never show a blank screen
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontFamily: C.mono, fontSize: "13px", color: C.t3, marginBottom: 16 }}>
            No articles found for <strong style={{ color: C.cyan }}>{brand}</strong>
          </div>
          <button onClick={handleCollect} style={{
            padding: "10px 24px", borderRadius: 8, border: `1px solid ${C.bGlow}`,
            background: "rgba(56,189,248,0.08)", color: C.cyan, fontFamily: C.sans,
            fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            ⬇ Fetch News Now
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articles.map((a, i) => <ArticleCard key={`${a.url || i}`} article={a} />)}
        </div>
      )}

      {/* Pagination */}
      {total > PER_PAGE && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 32 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.bDim}`,
              background: "transparent", color: page === 0 ? C.t4 : C.t2,
              fontFamily: C.sans, fontSize: "13px", cursor: page === 0 ? "not-allowed" : "pointer" }}>
            ← Prev
          </button>
          <span style={{ fontFamily: C.mono, fontSize: "11px", color: C.t3 }}>
            Page {page + 1} / {Math.ceil(total / PER_PAGE)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= total}
            style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.bDim}`,
              background: "transparent", color: (page + 1) * PER_PAGE >= total ? C.t4 : C.t2,
              fontFamily: C.sans, fontSize: "13px", cursor: (page + 1) * PER_PAGE >= total ? "not-allowed" : "pointer" }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
