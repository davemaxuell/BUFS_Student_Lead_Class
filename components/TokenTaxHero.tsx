"use client";

import { useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { countTokens, countChars, subwordTokens, showWhitespace } from "@/lib/tokenize";
import { translate } from "@/lib/translate";

// a distinct color per token, cycled — so the eye can count the pieces at a glance
const PALETTE = ["#7c9cff", "#5fe08a", "#ffb454", "#ff7a90", "#c792ea", "#58e0c8", "#f78c6c", "#82aaff", "#e0d96a", "#ff6fae"];

function TokenChips({ text }: { text: string }) {
  const toks = useMemo(() => subwordTokens(text), [text]);
  if (!toks.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
      {toks.map((tk, i) => {
        const c = PALETTE[i % PALETTE.length];
        return (
          <span
            key={i}
            title={`#${tk.id}`}
            style={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: ".82rem",
              padding: "2px 6px",
              borderRadius: 5,
              background: c + "26",
              border: `1px solid ${c}`,
              borderStyle: tk.broken ? "dashed" : "solid",
              color: "#eef2ff",
              whiteSpace: "pre",
            }}
          >
            {tk.broken ? "▢" : showWhitespace(tk.text)}
          </span>
        );
      })}
    </div>
  );
}

const PRESETS: { label: string; en: string; ko: string }[] = [
  {
    label: "AI",
    en: "Artificial intelligence is changing the world.",
    ko: "인공지능이 세상을 바꾸고 있습니다.",
  },
  {
    label: "Greeting",
    en: "Hello, how are you today?",
    ko: "안녕하세요, 오늘 기분이 어떠세요?",
  },
  {
    label: "School",
    en: "I am studying natural language processing at school.",
    ko: "저는 학교에서 자연어 처리를 공부하고 있습니다.",
  },
];

function Counter({ value, unit }: { value: number; unit: string }) {
  return (
    <span>
      <span className="count-big">{value}</span> <span className="count-unit">{unit}</span>
    </span>
  );
}

export default function TokenTaxHero() {
  const { lang } = useLang();
  const [en, setEn] = useState(PRESETS[0].en);
  const [ko, setKo] = useState(PRESETS[0].ko);

  // live two-way auto-translation via a free cloud endpoint (no download)
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  // Note: writing the OTHER box programmatically (setEn/setKo) does not fire its
  // onChange, so there is no translate→translate feedback loop.
  const schedule = (text: string, src: "en" | "ko", tgt: "en" | "ko") => {
    if (!auto) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const body = text.trim();
      if (!body) return;
      const myId = ++reqId.current;
      setErr(false);
      setBusy(true);
      try {
        const res = await translate(body, src, tgt);
        if (myId !== reqId.current) return; // a newer keystroke superseded this one
        if (res) { if (tgt === "ko") setKo(res); else setEn(res); }
      } catch {
        if (myId === reqId.current) setErr(true);
      } finally {
        if (myId === reqId.current) setBusy(false);
      }
    }, 600);
  };

  const onEn = (v: string) => { setEn(v); schedule(v, "en", "ko"); };
  const onKo = (v: string) => { setKo(v); schedule(v, "ko", "en"); };

  const enTok = useMemo(() => countTokens(en), [en]);
  const koTok = useMemo(() => countTokens(ko), [ko]);
  const enCh = useMemo(() => countChars(en), [en]);
  const koCh = useMemo(() => countChars(ko), [ko]);

  const ratio = enTok > 0 && koTok > 0 ? koTok / enTok : 0;

  let banner: React.ReactNode = null;
  if (enTok > 0 && koTok > 0) {
    if (Math.abs(ratio - 1) < 0.1) {
      banner = <div className="ratio">{S.hero.ratioSame[lang]}</div>;
    } else if (ratio >= 1) {
      banner = (
        <div className="ratio">
          {S.hero.ratioPre[lang]} <b>{ratio.toFixed(1)}</b>
          {S.hero.ratioPost[lang]}
        </div>
      );
    } else {
      banner = (
        <div className="ratio">
          English: <b>{(1 / ratio).toFixed(1)}</b>
          {S.hero.ratioFlip[lang]}
        </div>
      );
    }
  }

  return (
    <section id="puzzle">
      <div className="container">
        <div className="eyebrow">{S.hero.eyebrow[lang]}</div>
        <h1>{S.hero.title[lang]}</h1>
        <p className="lead">{S.hero.body[lang]}</p>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            {S.hero.autoLabel[lang]}
          </label>
          {busy && <span className="count-unit" style={{ color: "#58e0c8" }}>{S.hero.translating[lang]}</span>}
          {err && <span className="count-unit" style={{ color: "var(--danger)" }}>{S.hero.transErr[lang]}</span>}
        </div>
        <div className="note">{S.hero.autoHint[lang]}</div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <label className="label">{S.hero.enLabel[lang]}</label>
            <textarea rows={3} value={en} onChange={(e) => onEn(e.target.value)} />
            <div style={{ marginTop: 10 }}>
              <Counter value={enTok} unit={S.hero.tokens[lang]} />
              <span className="count-unit"> · {enCh} {S.hero.chars[lang]}</span>
            </div>
            <TokenChips text={en} />
          </div>
          <div className="card">
            <label className="label">{S.hero.koLabel[lang]}</label>
            <textarea rows={3} value={ko} onChange={(e) => onKo(e.target.value)} />
            <div style={{ marginTop: 10 }}>
              <Counter value={koTok} unit={S.hero.tokens[lang]} />
              <span className="count-unit"> · {koCh} {S.hero.chars[lang]}</span>
            </div>
            <TokenChips text={ko} />
          </div>
        </div>

        {banner}
        <div className="note">{S.hero.implication[lang]}</div>

        <div className="btnrow">
          <span className="count-unit" style={{ alignSelf: "center" }}>
            {S.hero.presets[lang]}
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="preset"
              onClick={() => {
                setEn(p.en);
                setKo(p.ko);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
