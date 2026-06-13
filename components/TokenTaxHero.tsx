"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { countTokens, countChars } from "@/lib/tokenize";

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

        <div className="grid2" style={{ marginTop: 22 }}>
          <div className="card">
            <label className="label">🇬🇧 {S.hero.enLabel[lang]}</label>
            <textarea rows={3} value={en} onChange={(e) => setEn(e.target.value)} />
            <div style={{ marginTop: 10 }}>
              <Counter value={enTok} unit={S.hero.tokens[lang]} />
              <span className="count-unit"> · {enCh} {S.hero.chars[lang]}</span>
            </div>
          </div>
          <div className="card">
            <label className="label">🇰🇷 {S.hero.koLabel[lang]}</label>
            <textarea rows={3} value={ko} onChange={(e) => setKo(e.target.value)} />
            <div style={{ marginTop: 10 }}>
              <Counter value={koTok} unit={S.hero.tokens[lang]} />
              <span className="count-unit"> · {koCh} {S.hero.chars[lang]}</span>
            </div>
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
