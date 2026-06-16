"use client";

import { useState } from "react";
import { S, useLang } from "@/lib/i18n";

// Click-to-stack puzzle: students assemble one Transformer block from four pieces,
// bottom → top. The correct pattern is attention → norm → feed-forward → norm.
// (The two "add & normalize" pieces are interchangeable, so we check by TYPE.)
type Kind = "attn" | "ffn" | "norm";
type Piece = { id: string; kind: Kind };

// master list (also defines the order pieces reappear in when removed)
const PIECES: Piece[] = [
  { id: "ffn", kind: "ffn" },
  { id: "norm-a", kind: "norm" },
  { id: "attn", kind: "attn" },
  { id: "norm-b", kind: "norm" },
];
const EXPECTED: Kind[] = ["attn", "norm", "ffn", "norm"];

const kindStyle = (k: Kind) => {
  if (k === "attn") return { bg: "#23306a", border: "#7c9cff" };
  if (k === "ffn") return { bg: "#1f3a33", border: "#58e0c8" };
  return { bg: "#2a2440", border: "#c792ea" }; // norm
};

export default function TransformerBuilder() {
  const { lang } = useLang();
  const t = S.d2.builder;
  const tt = S.d2.transformer; // reuse the piece labels from the diagram
  const [placed, setPlaced] = useState<string[]>([]);

  const label = (k: Kind) => (k === "attn" ? tt.mha[lang] : k === "ffn" ? tt.ffn[lang] : tt.addnorm[lang]);
  const kindOf = (id: string) => PIECES.find((p) => p.id === id)!.kind;

  const available = PIECES.filter((p) => !placed.includes(p.id));
  const full = placed.length === PIECES.length;
  const placedKinds = placed.map(kindOf);
  const correct = full && placedKinds.every((k, i) => k === EXPECTED[i]);
  const wrongAt = (i: number) => full && !correct && placedKinds[i] !== EXPECTED[i];

  const add = (id: string) => { if (!placed.includes(id)) setPlaced((p) => [...p, id]); };
  const remove = (id: string) => setPlaced((p) => p.filter((x) => x !== id));

  // a single block tile
  const Tile = ({ k, onClick, dim, mark, title }: { k: Kind; onClick?: () => void; dim?: boolean; mark?: "ok" | "bad"; title?: string }) => {
    const c = kindStyle(k);
    return (
      <div
        onClick={onClick}
        title={title}
        style={{
          background: c.bg,
          border: `2px solid ${mark === "ok" ? "var(--accent2)" : mark === "bad" ? "var(--danger)" : c.border}`,
          borderRadius: 10, padding: "12px 16px", textAlign: "center", fontWeight: 700,
          color: "var(--text)", cursor: onClick ? "pointer" : "default", opacity: dim ? 0.55 : 1,
          width: "100%", maxWidth: 320, transition: "transform .12s, border-color .15s",
        }}
      >
        {label(k)} {mark === "ok" ? "✓" : mark === "bad" ? "✗" : ""}
      </div>
    );
  };

  const Fixed = ({ text, dashed }: { text: string; dashed?: boolean }) => (
    <div style={{
      width: "100%", maxWidth: 320, padding: "10px 16px", textAlign: "center",
      borderRadius: 10, border: `1.5px ${dashed ? "dashed" : "solid"} var(--line)`,
      background: dashed ? "transparent" : "var(--panel2)", color: "var(--text2)", fontSize: ".92rem",
    }}>{text}</div>
  );

  const Arrow = () => <div style={{ color: "var(--accent2)", lineHeight: 1, fontSize: "1.1rem" }}>↑</div>;

  return (
    <section id="transformer-builder">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="grid2" style={{ marginTop: 18, alignItems: "start" }}>
          {/* LEFT: assembly area (bottom → top) */}
          <div className="card">
            <div className="count-unit" style={{ marginBottom: 12 }}>{t.placedTitle[lang]}</div>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              borderRadius: 14, padding: "16px 8px",
              border: `2px solid ${full ? (correct ? "var(--accent2)" : "var(--danger)") : "var(--line)"}`,
              background: "rgba(124,156,255,0.04)",
            }}>
              {/* output (top) */}
              <Fixed text={t.outputTarget[lang]} />
              <Arrow />
              {/* placed pieces, top of stack first */}
              {placed.length > 0 ? (
                [...placed].reverse().map((id, ri) => {
                  const i = placed.length - 1 - ri; // real index from bottom
                  return (
                    <div key={id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Tile k={kindOf(id)} onClick={() => remove(id)} title={t.removeHint[lang]}
                        mark={full ? (wrongAt(i) ? "bad" : "ok") : undefined} />
                      <Arrow />
                    </div>
                  );
                })
              ) : (
                <>
                  <Fixed text={t.goalSlot[lang]} dashed />
                  <Arrow />
                </>
              )}
              {/* input (bottom) */}
              <Fixed text={t.inputFixed[lang]} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
              <span className="count-unit">{placed.length} / {PIECES.length} {t.progress[lang]}</span>
              {placed.length > 0 && <button className="preset" onClick={() => setPlaced([])}>{t.reset[lang]}</button>}
            </div>
          </div>

          {/* RIGHT: palette + feedback */}
          <div className="card">
            <div className="count-unit" style={{ marginBottom: 12 }}>{t.palette[lang]}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {available.length > 0 ? (
                available.map((p) => <Tile key={p.id} k={p.kind} onClick={() => add(p.id)} />)
              ) : (
                <span className="count-unit">—</span>
              )}
            </div>
            <p className="note" style={{ marginTop: 12 }}>{t.removeHint[lang]}</p>

            {full && (
              <div className="callout" style={{ borderLeftColor: correct ? "var(--good)" : "var(--danger)" }}>
                <b style={{ color: correct ? "var(--good)" : "var(--danger)" }}>
                  {correct ? t.success[lang] : t.wrong[lang]}
                </b>
                {correct ? <div style={{ marginTop: 8 }}>{t.successWhy[lang]}</div> : (
                  <div style={{ marginTop: 10 }}>
                    <button className="lang-btn" onClick={() => setPlaced([])}>{t.tryAgain[lang]}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
