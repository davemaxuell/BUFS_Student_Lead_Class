"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";

type Word = { en: string; ko: string; x: number; y: number };

// A curated 2-D semantic map. Meaning clusters (royalty / animals / fruit /
// numbers), with Korean glosses so it doubles as a cross-lingual example.
const WORDS: Word[] = [
  { en: "king", ko: "왕", x: 20, y: 22 },
  { en: "queen", ko: "여왕", x: 30, y: 18 },
  { en: "prince", ko: "왕자", x: 17, y: 33 },
  { en: "princess", ko: "공주", x: 31, y: 32 },
  { en: "dog", ko: "개", x: 74, y: 20 },
  { en: "cat", ko: "고양이", x: 82, y: 27 },
  { en: "lion", ko: "사자", x: 70, y: 31 },
  { en: "tiger", ko: "호랑이", x: 84, y: 16 },
  { en: "apple", ko: "사과", x: 19, y: 72 },
  { en: "banana", ko: "바나나", x: 30, y: 80 },
  { en: "orange", ko: "오렌지", x: 16, y: 83 },
  { en: "grape", ko: "포도", x: 31, y: 69 },
  { en: "one", ko: "하나", x: 74, y: 72 },
  { en: "two", ko: "둘", x: 83, y: 78 },
  { en: "three", ko: "셋", x: 70, y: 82 },
  { en: "four", ko: "넷", x: 84, y: 68 },
];

export default function EmbeddingViz() {
  const { lang } = useLang();
  const t = S.emb;
  const [sel, setSel] = useState<number | null>(null);

  const neighbors = useMemo(() => {
    if (sel === null) return [];
    const a = WORDS[sel];
    return WORDS.map((w, i) => ({ i, d: Math.hypot(w.x - a.x, w.y - a.y) }))
      .filter((o) => o.i !== sel)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .map((o) => o.i);
  }, [sel]);

  const isNb = (i: number) => neighbors.includes(i);

  return (
    <section id="embeddings">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ position: "relative", height: 380, width: "100%" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {sel !== null &&
                neighbors.map((i) => (
                  <line key={i} x1={WORDS[sel].x} y1={WORDS[sel].y} x2={WORDS[i].x} y2={WORDS[i].y} stroke="#58e0c8" strokeWidth={0.4} strokeDasharray="1 1" />
                ))}
            </svg>
            {WORDS.map((w, i) => {
              const active = sel === i;
              const nb = isNb(i);
              return (
                <button
                  key={w.en}
                  className="emb-pt"
                  onClick={() => setSel(active ? null : i)}
                  style={{
                    position: "absolute",
                    left: `${w.x}%`,
                    top: `${w.y}%`,
                    transform: "translate(-50%,-50%)",
                    animationDelay: `${i * 45}ms`,
                    background: active ? "var(--accent)" : nb ? "rgba(88,224,200,0.22)" : "var(--panel2)",
                    border: `1px solid ${active ? "var(--accent)" : nb ? "var(--accent2)" : "var(--line)"}`,
                    color: active ? "#0b1020" : "var(--text)",
                    opacity: sel === null || active || nb ? 1 : 0.4,
                  }}
                >
                  {w.en} <span style={{ opacity: 0.7, fontSize: ".82em" }}>/ {w.ko}</span>
                </button>
              );
            })}
          </div>
        </div>

        {sel !== null && (
          <div className="callout">
            <b>{WORDS[sel].en} / {WORDS[sel].ko}</b> — {t.neighbors[lang]}:{" "}
            {neighbors.map((i) => `${WORDS[i].en}/${WORDS[i].ko}`).join(", ")}
          </div>
        )}
        <div className="note">{t.note[lang]}</div>
      </div>
    </section>
  );
}
