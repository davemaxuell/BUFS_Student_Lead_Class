"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";

// A short sentence with a toy 2-D "meaning vector" per token. We run REAL scaled
// dot-product self-attention on these vectors, so the weights are computed, not
// faked — students see the actual mechanism on numbers small enough to follow.
const TOKENS = [
  { w: "The", v: [0.15, 0.1] },
  { w: "cat", v: [0.95, 0.25] },
  { w: "sat", v: [0.8, 0.65] },
  { w: "on", v: [0.1, 0.75] },
  { w: "the", v: [0.15, 0.1] },
  { w: "mat", v: [0.9, 0.3] },
];

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];

function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const ex = xs.map((x) => Math.exp(x - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

// attention row for a given query index: softmax over scaled dot products
function attentionRow(qi: number): number[] {
  const q = TOKENS[qi].v;
  const scores = TOKENS.map((t) => dot(q, t.v) / Math.sqrt(2));
  return softmax(scores);
}

// color ramp panel→accent by weight (0..1)
function heatColor(w: number, max = 1) {
  const a = Math.min(w / max, 1);
  return `rgba(124, 156, 255, ${0.08 + a * 0.92})`;
}

export default function AttentionViz() {
  const { lang } = useLang();
  const t = S.d2.attention;
  const [qi, setQi] = useState(2); // default: "sat"

  const weights = useMemo(() => attentionRow(qi), [qi]);
  const matrix = useMemo(() => TOKENS.map((_, i) => attentionRow(i)), []);
  const topIdx = useMemo(
    () => weights.map((w, i) => [w, i] as const).filter(([, i]) => i !== qi).sort((a, b) => b[0] - a[0])[0]?.[1] ?? qi,
    [weights, qi]
  );

  // SVG layout: tokens evenly along a row; arcs spring from the query up & over.
  const W = 640, H = 200, padX = 40;
  const step = (W - 2 * padX) / (TOKENS.length - 1);
  const xOf = (i: number) => padX + i * step;
  const baseY = 150;
  const qx = xOf(qi);

  return (
    <section id="attention">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.desc[lang]}</p>

        <div className="grid2" style={{ marginTop: 18, alignItems: "start" }}>
          {/* LEFT: sentence + arcs + weight bars */}
          <div className="card">
            <div className="count-unit" style={{ marginBottom: 8 }}>{t.pickHint[lang]}</div>

            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
              {/* arcs from query to every token; opacity/width encode weight */}
              {TOKENS.map((_, i) => {
                if (i === qi) return null;
                const x2 = xOf(i);
                const mx = (qx + x2) / 2;
                const lift = 60 + Math.abs(qx - x2) * 0.12;
                const w = weights[i];
                return (
                  <path
                    key={i}
                    d={`M ${qx} ${baseY - 16} Q ${mx} ${baseY - lift} ${x2} ${baseY - 16}`}
                    fill="none"
                    stroke="#7c9cff"
                    strokeWidth={1 + w * 9}
                    strokeOpacity={0.18 + w * 0.82}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* token chips */}
              {TOKENS.map((tk, i) => {
                const x = xOf(i);
                const isQ = i === qi;
                const w = weights[i];
                return (
                  <g key={i} onClick={() => setQi(i)} style={{ cursor: "pointer" }}>
                    <rect
                      x={x - 30} y={baseY - 16} width={60} height={32} rx={9}
                      fill={isQ ? "#7c9cff" : "#1d2750"}
                      stroke={isQ ? "#e9edff" : "#2a386e"} strokeWidth={isQ ? 2 : 1}
                    />
                    <text x={x} y={baseY + 5} textAnchor="middle" fontSize="15"
                      fill={isQ ? "#0b1020" : "#e9edff"} fontWeight={isQ ? 800 : 500}>{tk.w}</text>
                    {/* weight % under each token */}
                    {!isQ && (
                      <text x={x} y={baseY + 34} textAnchor="middle" fontSize="12"
                        fill="#c6cdf0" fontFamily="ui-monospace, monospace">{(w * 100).toFixed(0)}%</text>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="callout" style={{ marginTop: 4 }}>
              <b style={{ color: "var(--accent2)" }}>{TOKENS[qi].w}</b>{" "}
              {t.attendsTo[lang]}{" "}
              <b style={{ color: "var(--accent)" }}>{TOKENS[topIdx].w}</b>.
            </div>

            {/* weight bars */}
            <div style={{ marginTop: 12 }}>
              <div className="count-unit" style={{ marginBottom: 6 }}>{t.barCaption[lang]}</div>
              {TOKENS.map((tk, i) => (
                <div className="bar-row" key={i} style={{ gridTemplateColumns: "70px 1fr 52px", margin: "5px 0" }}>
                  <div className="bar-label" style={{ fontWeight: i === qi ? 800 : 500 }}>{tk.w}</div>
                  <div className="bar-track" style={{ height: 18 }}>
                    <div className="bar-fill" style={{ width: `${Math.max(weights[i] * 100, 1.5)}%` }} />
                  </div>
                  <div className="bar-meta">{(weights[i] * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: full attention matrix heatmap */}
          <div className="card">
            <div className="count-unit" style={{ marginBottom: 8 }}>{t.matrixCaption[lang]}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", margin: "0 auto" }}>
                <tbody>
                  <tr>
                    <td />
                    {TOKENS.map((tk, j) => (
                      <td key={j} style={{ padding: "4px 6px", textAlign: "center", fontSize: ".8rem", color: "var(--muted)", borderBottom: "none" }}>{tk.w}</td>
                    ))}
                  </tr>
                  {matrix.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding: "4px 8px", fontSize: ".82rem", color: i === qi ? "var(--accent2)" : "var(--text2)", fontWeight: i === qi ? 800 : 500, borderBottom: "none", whiteSpace: "nowrap" }}>{TOKENS[i].w}</td>
                      {row.map((w, j) => (
                        <td
                          key={j}
                          onClick={() => setQi(i)}
                          title={`${TOKENS[i].w} → ${TOKENS[j].w}: ${(w * 100).toFixed(0)}%`}
                          style={{
                            width: 34, height: 34, textAlign: "center", cursor: "pointer",
                            background: heatColor(w), border: "1px solid #0b1020",
                            outline: i === qi ? "2px solid var(--accent2)" : "none", outlineOffset: -2,
                            fontSize: ".72rem", color: w > 0.45 ? "#0b1020" : "#c6cdf0", fontFamily: "ui-monospace, monospace",
                          }}
                        >{(w * 100).toFixed(0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mono" style={{ marginTop: 14, fontSize: ".85rem" }}>{t.formula[lang]}</div>
          </div>
        </div>

        <div className="callout">{t.takeaway[lang]}</div>
      </div>
    </section>
  );
}
