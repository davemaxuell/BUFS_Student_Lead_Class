"use client";

import { S, useLang } from "@/lib/i18n";

// A static, labeled flow diagram of ONE Transformer block, bottom → top, with the
// two residual (skip) connections drawn as curved arrows on the left. Faded copies
// behind the main block show that the same block is stacked many times.
export default function TransformerBlock() {
  const { lang } = useLang();
  const t = S.d2.transformer;

  // box helper coordinates (single column, bottom-up)
  const cx = 250, bw = 250;
  const boxes = [
    { y: 470, h: 46, label: t.inputs[lang], kind: "io" as const },
    { y: 372, h: 64, label: t.mha[lang], note: t.mhaNote[lang], kind: "attn" as const },
    { y: 300, h: 40, label: t.addnorm[lang], kind: "norm" as const },
    { y: 202, h: 64, label: t.ffn[lang], note: t.ffnNote[lang], kind: "ffn" as const },
    { y: 130, h: 40, label: t.addnorm[lang], kind: "norm" as const },
    { y: 40, h: 46, label: t.output[lang], kind: "io" as const },
  ];
  const fill = (k: string) =>
    k === "attn" ? "#23306a" : k === "ffn" ? "#1f3a33" : k === "norm" ? "#2a2440" : "#161e3d";
  const stroke = (k: string) =>
    k === "attn" ? "#7c9cff" : k === "ffn" ? "#58e0c8" : k === "norm" ? "#c792ea" : "#2a386e";

  return (
    <section id="transformer">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.desc[lang]}</p>

        <div className="grid2" style={{ marginTop: 18, alignItems: "center" }}>
          <div className="card" style={{ display: "flex", justifyContent: "center" }}>
            <svg viewBox="0 0 520 540" style={{ width: "100%", maxWidth: 460, height: "auto" }}>
              {/* faded stacked copies behind, to suggest ×N */}
              {[18, 9].map((o, i) => (
                <rect key={i} x={cx - bw / 2 + o} y={20 + o} width={bw} height={510} rx={16}
                  fill="none" stroke="#2a386e" strokeOpacity={0.5 - i * 0.18} strokeDasharray="4 5" />
              ))}
              {/* main block outline */}
              <rect x={cx - bw / 2} y={20} width={bw} height={510} rx={16} fill="rgba(124,156,255,0.04)" stroke="#3a4890" />

              {/* vertical flow arrows between boxes */}
              {boxes.slice(0, -1).map((b, i) => {
                const next = boxes[i + 1];
                return (
                  <line key={i} x1={cx} y1={b.y} x2={cx} y2={next.y + next.h}
                    stroke="#58e0c8" strokeWidth={2} markerEnd="url(#arrow)" />
                );
              })}

              {/* residual (skip) arrows on the left: input→add&norm1, addnorm1→add&norm2 */}
              {[
                { from: 470, to: 300 + 40 },
                { from: 300, to: 130 + 40 },
              ].map((r, i) => (
                <path key={i}
                  d={`M ${cx - bw / 2} ${r.from} C 70 ${r.from}, 70 ${r.to}, ${cx - bw / 2} ${r.to}`}
                  fill="none" stroke="#ffb454" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#arrowAmber)" />
              ))}

              {/* boxes */}
              {boxes.map((b, i) => (
                <g key={i}>
                  <rect x={cx - bw / 2} y={b.y} width={bw} height={b.h} rx={10}
                    fill={fill(b.kind)} stroke={stroke(b.kind)} strokeWidth={1.5} />
                  <text x={cx} y={b.note ? b.y + b.h / 2 - 4 : b.y + b.h / 2 + 5}
                    textAnchor="middle" fill="#e9edff" fontSize="14.5" fontWeight={700}>{b.label}</text>
                  {b.note && (
                    <text x={cx} y={b.y + b.h / 2 + 15} textAnchor="middle" fill="#c6cdf0" fontSize="11.5">{b.note}</text>
                  )}
                </g>
              ))}

              {/* residual label */}
              <text x={64} y={300} textAnchor="middle" fill="#ffb454" fontSize="11" transform="rotate(-90 64 300)">{t.residual[lang]}</text>

              <defs>
                <marker id="arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#58e0c8" />
                </marker>
                <marker id="arrowAmber" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ffb454" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* legend / explanation */}
          <div className="card">
            <ul className="clean">
              <li style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ flex: "0 0 14px", height: 14, borderRadius: 4, background: "#23306a", border: "1px solid #7c9cff" }} />
                <span><b>{t.mha[lang]}</b> — {t.legendAttn[lang]}</span>
              </li>
              <li style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ flex: "0 0 14px", height: 14, borderRadius: 4, background: "#1f3a33", border: "1px solid #58e0c8" }} />
                <span><b>{t.ffn[lang]}</b> — {t.legendFfn[lang]}</span>
              </li>
              <li style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ flex: "0 0 14px", height: 14, borderRadius: 4, background: "#2a2440", border: "1px solid #c792ea" }} />
                <span><b>{t.addnorm[lang]}</b></span>
              </li>
              <li style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ flex: "0 0 14px", height: 0, marginTop: 7, borderTop: "2px dashed #ffb454" }} />
                <span>{t.residual[lang]}</span>
              </li>
            </ul>
            <div className="callout" style={{ borderLeftColor: "var(--warn)" }}>{t.stack[lang]}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
