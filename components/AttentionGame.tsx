"use client";

import { useState } from "react";
import { S, useLang } from "@/lib/i18n";

// Winograd-style coreference puzzles. The student picks which word the
// highlighted (ambiguous) word refers to; we reveal the link the way attention
// would. Sentences are stored as segments with explicit spacing so they render
// cleanly in both languages (Korean particles stay attached to their word).
type Seg = { t: string; cand?: "a" | "b"; pron?: boolean };
type Bi = { en: string; ko: string };
type Puzzle = {
  en: Seg[];
  ko: Seg[];
  candA: Bi;
  candB: Bi;
  answer: "a" | "b";
  why: Bi;
};

const PUZZLES: Puzzle[] = [
  {
    en: [
      { t: "The " }, { t: "trophy", cand: "a" }, { t: " didn't fit in the " },
      { t: "suitcase", cand: "b" }, { t: " because " }, { t: "it", pron: true }, { t: " was too big." },
    ],
    ko: [
      { t: "트로피", cand: "a" }, { t: "가 여행 " }, { t: "가방", cand: "b" },
      { t: "에 들어가지 않았다 — " }, { t: "그것", pron: true }, { t: "이 너무 컸기 때문이다." },
    ],
    candA: { en: "trophy", ko: "트로피" },
    candB: { en: "suitcase", ko: "가방" },
    answer: "a",
    why: {
      en: "The big thing is the trophy, so “it” must be the trophy.",
      ko: "큰 것은 트로피이므로 “그것”은 트로피입니다.",
    },
  },
  {
    en: [
      { t: "The " }, { t: "cat", cand: "a" }, { t: " chased the " }, { t: "mouse", cand: "b" },
      { t: " because " }, { t: "it", pron: true }, { t: " was hungry." },
    ],
    ko: [
      { t: "고양이", cand: "a" }, { t: "가 " }, { t: "쥐", cand: "b" }, { t: "를 쫓았다 — " },
      { t: "그것", pron: true }, { t: "이 배고팠기 때문이다." },
    ],
    candA: { en: "cat", ko: "고양이" },
    candB: { en: "mouse", ko: "쥐" },
    answer: "a",
    why: {
      en: "The hungry one is doing the chasing — the cat.",
      ko: "배고픈 쪽이 쫓고 있습니다 — 고양이입니다.",
    },
  },
  {
    en: [
      { t: "The " }, { t: "man", cand: "a" }, { t: " couldn't lift his " }, { t: "son", cand: "b" },
      { t: " because " }, { t: "he", pron: true }, { t: " was so heavy." },
    ],
    ko: [
      { t: "남자", cand: "a" }, { t: "는 자기 " }, { t: "아들", cand: "b" }, { t: "을 들어 올릴 수 없었다 — " },
      { t: "그", pron: true }, { t: "가 너무 무거웠기 때문이다." },
    ],
    candA: { en: "man", ko: "남자" },
    candB: { en: "son", ko: "아들" },
    answer: "b",
    why: {
      en: "The heavy one is the son — that's why he can't be lifted.",
      ko: "무거운 쪽은 아들입니다 — 그래서 들어 올릴 수 없습니다.",
    },
  },
];

export default function AttentionGame() {
  const { lang } = useLang();
  const t = S.d2.game;
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const p = PUZZLES[idx];
  const segs = lang === "en" ? p.en : p.ko;
  const pronWord = segs.find((s) => s.pron)?.t ?? "it";
  const isLast = idx === PUZZLES.length - 1;
  const revealed = picked !== null;
  const isCorrect = picked === p.answer;

  const pick = (c: "a" | "b") => {
    if (picked) return;
    setPicked(c);
    setAnswered((n) => n + 1);
    if (c === p.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (isLast) { setIdx(0); setPicked(null); setScore(0); setAnswered(0); return; }
    setIdx((i) => i + 1);
    setPicked(null);
  };

  // segment styling on reveal: pronoun + correct candidate light up teal;
  // a wrong pick lights up red.
  const segStyle = (s: Seg): React.CSSProperties => {
    const base: React.CSSProperties = { padding: "1px 2px", borderRadius: 6 };
    if (s.pron) {
      return revealed
        ? { ...base, background: "rgba(88,224,200,0.22)", color: "#9af5e0", fontWeight: 800, padding: "2px 7px" }
        : { ...base, background: "rgba(255,180,84,0.22)", color: "var(--warn)", fontWeight: 800, padding: "2px 7px" };
    }
    if (s.cand && revealed) {
      if (s.cand === p.answer) return { ...base, background: "rgba(88,224,200,0.22)", color: "#9af5e0", fontWeight: 700, padding: "2px 7px" };
      if (s.cand === picked) return { ...base, background: "rgba(255,122,144,0.2)", color: "var(--danger)", padding: "2px 7px" };
    }
    return base;
  };

  const candBtn = (c: "a" | "b", label: string) => {
    const style: React.CSSProperties = { fontSize: "1rem", padding: "10px 22px", fontWeight: 700 };
    if (revealed) {
      if (c === p.answer) { style.borderColor = "var(--accent2)"; style.color = "var(--accent2)"; style.background = "rgba(88,224,200,0.12)"; }
      else if (c === picked) { style.borderColor = "var(--danger)"; style.color = "var(--danger)"; style.background = "rgba(255,122,144,0.1)"; }
      else { style.opacity = 0.5; }
    }
    return (
      <button className="preset" style={style} onClick={() => pick(c)} disabled={revealed}>
        {label} {revealed && c === p.answer ? "✓" : revealed && c === picked ? "✗" : ""}
      </button>
    );
  };

  return (
    <section id="attention-game">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="card" style={{ marginTop: 18, maxWidth: 720 }}>
          {/* the sentence */}
          <p style={{ fontSize: "1.35rem", lineHeight: 1.7, margin: "4px 0 18px" }}>
            {segs.map((s, i) => (
              <span key={i} style={segStyle(s)}>{s.t}</span>
            ))}
          </p>

          {/* the question + choices */}
          <div className="count-unit" style={{ marginBottom: 10 }}>
            {t.prompt[lang].replace("{w}", pronWord)}
          </div>
          <div className="btnrow" style={{ gap: 12 }}>
            {candBtn("a", lang === "en" ? p.candA.en : p.candA.ko)}
            {candBtn("b", lang === "en" ? p.candB.en : p.candB.ko)}
          </div>

          {/* feedback */}
          {revealed && (
            <div className="callout" style={{ marginTop: 16, borderLeftColor: isCorrect ? "var(--good)" : "var(--danger)" }}>
              <b style={{ color: isCorrect ? "var(--good)" : "var(--danger)" }}>
                {isCorrect ? t.correct[lang] : t.wrong[lang]}
              </b>{" "}
              {p.why[lang]}
              <div style={{ marginTop: 8, color: "var(--text2)" }}>
                <b style={{ color: "var(--accent2)" }}>{t.reveal[lang]}</b>{" "}
                <span style={{ color: "#9af5e0", fontWeight: 700 }}>{pronWord}</span>
                {" → "}
                <span style={{ color: "#9af5e0", fontWeight: 700 }}>
                  {(p.answer === "a" ? p.candA : p.candB)[lang]}
                </span>
              </div>
            </div>
          )}

          {/* footer: score + next */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
            <span className="count-unit">
              {t.score[lang]}: <b style={{ color: "var(--text)" }}>{score}</b> / {answered}
            </span>
            {revealed && (
              <button className="lang-btn" onClick={next}>
                {isLast ? t.again[lang] : t.next[lang]}
              </button>
            )}
          </div>
        </div>

        <div className="callout">{t.tieIn[lang]}</div>
      </div>
    </section>
  );
}
