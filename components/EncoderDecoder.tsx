"use client";

import { S, useLang } from "@/lib/i18n";

// Side-by-side attention-mask grids. Same machinery, one difference: which cells
// are allowed (green). Encoder = full square (bidirectional). Decoder = lower
// triangular (causal — can only look back). Row = looker, column = looked-at.
const TOKENS = ["The", "cat", "sat", "down"];

function MaskGrid({ causal, accent }: { causal: boolean; accent: string }) {
  const { lang } = useLang();
  const t = S.d2.encdec;
  const n = TOKENS.length;
  const cell = 40, pad = 52;
  const size = pad + n * cell + 8;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: 280, height: "auto" }}>
      {/* column header (looked-at) */}
      <text x={pad + (n * cell) / 2} y={16} textAnchor="middle" fontSize="11" fill="var(--muted)">{t.colTo[lang]}</text>
      {TOKENS.map((w, j) => (
        <text key={j} x={pad + j * cell + cell / 2} y={42} textAnchor="middle" fontSize="12" fill="#c6cdf0">{w}</text>
      ))}
      {/* row header (looker) */}
      <text x={14} y={pad + (n * cell) / 2} textAnchor="middle" fontSize="11" fill="var(--muted)" transform={`rotate(-90 14 ${pad + (n * cell) / 2})`}>{t.rowFrom[lang]}</text>
      {TOKENS.map((w, i) => (
        <text key={i} x={pad - 6} y={pad + i * cell + cell / 2 + 4} textAnchor="end" fontSize="12" fill="#c6cdf0">{w}</text>
      ))}
      {/* cells */}
      {TOKENS.map((_, i) =>
        TOKENS.map((__, j) => {
          const allowed = causal ? j <= i : true;
          return (
            <rect key={`${i}-${j}`}
              x={pad + j * cell} y={pad + i * cell} width={cell - 4} height={cell - 4} rx={6}
              fill={allowed ? accent : "#141b34"}
              fillOpacity={allowed ? 0.85 : 1}
              stroke={allowed ? accent : "#222c52"} strokeWidth={1} />
          );
        })
      )}
    </svg>
  );
}

export default function EncoderDecoder() {
  const { lang } = useLang();
  const t = S.d2.encdec;
  return (
    <section id="encdec">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.desc[lang]}</p>

        <div className="grid2" style={{ marginTop: 18, alignItems: "start" }}>
          <div className="card">
            <h3 style={{ color: "var(--accent)" }}>{t.encoderName[lang]}</h3>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
              <MaskGrid causal={false} accent="#7c9cff" />
            </div>
            <p className="note">{t.encoderNote[lang]}</p>
          </div>

          <div className="card">
            <h3 style={{ color: "var(--accent2)" }}>{t.decoderName[lang]}</h3>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
              <MaskGrid causal accent="#58e0c8" />
            </div>
            <p className="note">{t.decoderNote[lang]}</p>
          </div>
        </div>

        <p className="note" style={{ textAlign: "center", marginTop: 10 }}>{t.maskCaption[lang]}</p>
        <div className="callout">{t.combined[lang]}</div>
      </div>
    </section>
  );
}
