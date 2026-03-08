import { useState } from "react";
import axios from "axios";
import { C, card, badge, mono } from "../theme";

const PAGE = { background:C.void, minHeight:"100vh", padding:"44px 56px", animation:"fadeUp .35s ease both" };

const INFO = [
  { label:"Max File Size", value:"50 MB",          icon:"◈", color:C.cyan   },
  { label:"Formats",       value:"CSV, TSV",        icon:"◆", color:C.violet },
  { label:"Processing",    value:"Async batch ML",  icon:"▶", color:C.neu    },
  { label:"Output",        value:"Labeled + scores",icon:"✓", color:C.pos    },
];

export default function CsvUpload() {
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done,      setDone]      = useState(false);

  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await axios.post("http://127.0.0.1:8000/upload-csv", fd);
      console.log(r.data);
      setDone(true);
    } catch(e) { console.error(e); }
    finally { setUploading(false); }
  }

  return (
    <div style={PAGE}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"38px", paddingBottom:"28px", borderBottom:`1px solid ${C.bDim}` }}>
        <div>
          <h1 style={{ fontFamily:C.mono, fontSize:"28px", fontWeight:"700", color:C.t1, letterSpacing:"-.02em", display:"flex", alignItems:"center", gap:"14px" }}>
            <span style={{ display:"block", width:"5px", height:"32px", background:"linear-gradient(180deg,#f5c842,#f59e0b)", borderRadius:"3px", boxShadow:"0 0 18px rgba(245,200,66,.8)", flexShrink:0 }} />
            Upload CSV Dataset
          </h1>
          <p style={{ fontFamily:C.mono, fontSize:"11px", letterSpacing:".12em", textTransform:"uppercase", color:C.t3, marginTop:"10px", marginLeft:"19px" }}>
            Batch sentiment processing pipeline
          </p>
        </div>
        <span style={badge(C.neu)}>CSV · TSV</span>
      </div>

      {/* ── Two columns ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:"24px" }}>

        {/* LEFT: Upload */}
        <div style={card()}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(245,200,66,0.4),transparent)" }} />

          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"24px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:C.neu, boxShadow:`0 0 12px ${C.neu}`, animation:"glowPulse 2.5s ease-in-out infinite" }} />
            <span style={mono(11, C.t2, { letterSpacing:".1em", textTransform:"uppercase", fontWeight:"700" })}>Data Source</span>
          </div>

          {/* Drop zone */}
          <label htmlFor="csv-file" className="drop-zone" style={{
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:"10px", padding:"52px 32px", borderRadius:"14px", cursor:"pointer",
            border:`1px dashed rgba(245,200,66,0.35)`,
            background:"rgba(245,200,66,0.03)", textAlign:"center",
            transition:"all .2s",
          }}>
            <div style={{ fontSize:"44px", opacity: file ? .9 : .4, lineHeight:1, color: file ? C.neu : C.t3 }}>
              {file ? "✓" : "⬆"}
            </div>
            {file ? (
              <>
                <div style={{ fontFamily:C.mono, fontSize:"15px", fontWeight:"700", color:C.neu }}>{file.name}</div>
                <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.t3 }}>{(file.size/1024).toFixed(1)} KB · Click to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily:C.mono, fontSize:"14px", fontWeight:"700", color:C.t2, letterSpacing:".04em" }}>Drop your CSV file here</div>
                <div style={{ fontFamily:C.mono, fontSize:"11px", color:C.t3 }}>or click to browse — max 50 MB</div>
              </>
            )}
          </label>
          <input id="csv-file" type="file" accept=".csv,.tsv" style={{ display:"none" }}
            onChange={e => { setFile(e.target.files[0]); setDone(false); }} />

          {/* Column requirements */}
          <div style={{ margin:"22px 0 20px", padding:"18px 22px", background:C.raised, border:`1px solid ${C.bDim}`, borderRadius:"10px" }}>
            <div style={mono(9, C.t3, { letterSpacing:".12em", textTransform:"uppercase", marginBottom:"12px" })}>
              Expected columns
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {["text","brand","date"].map(t => (
                <span key={t} style={{ fontFamily:C.mono, fontSize:"12px", padding:"4px 14px", borderRadius:"6px", color:C.cyan, background:"rgba(56,189,248,0.09)", border:`1px solid rgba(56,189,248,0.22)` }}>
                  {t}
                </span>
              ))}
              <span style={{ fontFamily:C.mono, fontSize:"12px", padding:"4px 14px", color:C.t3 }}>source (optional)</span>
            </div>
          </div>

          {/* Action */}
          <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
            <button
              className="btn-primary"
              disabled={!file || uploading}
              onClick={upload}
              style={{
                display:"inline-flex", alignItems:"center", gap:"9px",
                padding:"13px 28px", borderRadius:"10px",
                background:"rgba(56,189,248,0.12)", border:`1px solid rgba(56,189,248,0.45)`,
                color:C.cyan, fontFamily:C.mono, fontSize:"12px", fontWeight:"700",
                letterSpacing:".09em", textTransform:"uppercase",
                cursor:(!file||uploading)?"not-allowed":"pointer",
                opacity:(!file||uploading)?.5:1, transition:"all .2s",
              }}
            >
              {uploading
                ? <><span style={{ width:"11px", height:"11px", borderRadius:"50%", border:"2px solid rgba(56,189,248,0.25)", borderTopColor:C.cyan, display:"inline-block", animation:"spin .6s linear infinite" }} /> Processing...</>
                : <>▶ &nbsp;Upload &amp; Analyze</>
              }
            </button>
            {done && (
              <span style={{ fontFamily:C.mono, fontSize:"12px", color:C.pos, letterSpacing:".07em", animation:"fadeUp .3s ease both" }}>
                ✓ Upload successful
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Info cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {INFO.map(({ label, value, icon, color }) => (
            <div key={label} style={{
              background:C.card, border:`1px solid ${C.bDim}`,
              borderLeft:`3px solid ${color}`,
              borderRadius:"12px", padding:"22px 24px",
              display:"flex", alignItems:"center", gap:"18px",
              boxShadow:`-4px 0 20px ${color}18`,
              transition:"border-color .2s",
            }}>
              <span style={{ fontSize:"22px", color, opacity:.85, width:"26px", textAlign:"center", flexShrink:0 }}>{icon}</span>
              <div>
                <div style={mono(9, C.t3, { letterSpacing:".12em", textTransform:"uppercase", marginBottom:"5px" })}>{label}</div>
                <div style={{ fontFamily:C.sans, fontSize:"15px", fontWeight:"600", color:C.t2 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}