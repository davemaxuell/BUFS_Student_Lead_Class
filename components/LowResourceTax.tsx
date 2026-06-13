"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { countTokens } from "@/lib/tokenize";

// All sentences mean: "Artificial intelligence is changing the world."
const SENTENCES: { name: { en: string; ko: string }; text: string }[] = [
  { name: { en: "English", ko: "영어" }, text: "Artificial intelligence is changing the world." },
  { name: { en: "Spanish", ko: "스페인어" }, text: "La inteligencia artificial está cambiando el mundo." },
  { name: { en: "Chinese", ko: "중국어" }, text: "人工智能正在改变世界。" },
  { name: { en: "Japanese", ko: "일본어" }, text: "人工知能は世界を変えています。" },
  { name: { en: "Korean", ko: "한국어" }, text: "인공지능이 세상을 바꾸고 있습니다." },
  { name: { en: "Hindi", ko: "힌디어" }, text: "कृत्रिम बुद्धिमत्ता दुनिया को बदल रही है।" },
  { name: { en: "Swahili", ko: "스와힐리어" }, text: "Akili bandia inabadilisha ulimwengu." },
  { name: { en: "Amharic", ko: "암하라어" }, text: "ሰው ሰራሽ አስተዋይነት ዓለምን እየቀየረ ነው።" },
];

export default function LowResourceTax() {
  const { lang } = useLang();
  const t = S.tax;
  const c = S.cost;

  // Cost calculator state. Token-per-message figures come from the real
  // EN/KR example sentences so the numbers stay honest.
  const enTok = useMemo(() => countTokens(SENTENCES[0].text), []);
  const koTok = useMemo(
    () => countTokens(SENTENCES.find((s) => s.name.en === "Korean")!.text),
    []
  );
  const [messages, setMessages] = useState(10000);
  const [price, setPrice] = useState(5);
  const [cur, setCur] = useState<"$" | "₩">("$");

  const enCost = (messages * enTok * price) / 1_000_000;
  const koCost = (messages * koTok * price) / 1_000_000;
  const fmt = (v: number) =>
    cur === "₩"
      ? "₩" + Math.round(v).toLocaleString()
      : "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const setCurrency = (n: "$" | "₩") => {
    setCur(n);
    setPrice(n === "₩" ? 7000 : 5);
  };

  const rows = useMemo(() => {
    const counted = SENTENCES.map((s) => ({ ...s, tokens: countTokens(s.text) }));
    const en = counted.find((c) => c.name.en === "English")?.tokens ?? 1;
    const max = Math.max(...counted.map((c) => c.tokens));
    return counted
      .map((c) => ({ ...c, ratio: c.tokens / en, pct: (c.tokens / max) * 100 }))
      .sort((a, b) => a.tokens - b.tokens);
  }, []);

  return (
    <section id="tax">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="card" style={{ marginTop: 18 }}>
          {rows.map((r) => (
            <div className="bar-row" key={r.name.en}>
              <div className="bar-label">{r.name[lang]}</div>
              <div className="bar-track">
                <div
                  className={"bar-fill" + (r.ratio >= 2 ? " hot" : "")}
                  style={{ width: `${Math.max(r.pct, 4)}%` }}
                />
              </div>
              <div className="bar-meta">
                {r.tokens} {t.tokens[lang]} · {r.ratio.toFixed(1)}
                {t.vsEn[lang]}
              </div>
            </div>
          ))}
        </div>

        <div className="grid2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>{t.why[lang]}</h3>
            <p className="desc">{t.whyBody[lang]}</p>
          </div>
          <div className="card">
            <h3>{t.costs[lang]}</h3>
            <ul className="clean">
              <li>{t.cost1[lang]}</li>
              <li>{t.cost2[lang]}</li>
              <li>{t.cost3[lang]}</li>
              <li>{t.cost4[lang]}</li>
            </ul>
          </div>
        </div>

        <div className="callout">{t.fix[lang]}</div>

        {/* Cost calculator */}
        <div className="card" style={{ marginTop: 18 }}>
          <h3>{c.title[lang]}</h3>
          <p className="desc">{c.intro[lang]}</p>

          <div className="grid3" style={{ marginTop: 12 }}>
            <div>
              <label className="label">{c.messages[lang]}</label>
              <input
                type="number"
                min={0}
                value={messages}
                onChange={(e) => setMessages(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="label">{c.price[lang]} ({cur})</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="label">{c.currency[lang]}</label>
              <div className="btnrow" style={{ marginTop: 0 }}>
                <button className="preset" onClick={() => setCurrency("$")} style={cur === "$" ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}>$ USD</button>
                <button className="preset" onClick={() => setCurrency("₩")} style={cur === "₩" ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}>₩ KRW</button>
              </div>
            </div>
          </div>

          <div className="grid3" style={{ marginTop: 14 }}>
            <div className="card">
              <div className="count-unit">{c.enCost[lang]}</div>
              <div className="count-big">{fmt(enCost)}</div>
              <div className="count-unit">{enTok} {c.perMsg[lang]}</div>
            </div>
            <div className="card">
              <div className="count-unit">{c.koCost[lang]}</div>
              <div className="count-big">{fmt(koCost)}</div>
              <div className="count-unit">{koTok} {c.perMsg[lang]}</div>
            </div>
            <div className="card" style={{ borderColor: "var(--warn)" }}>
              <div className="count-unit">{c.extra[lang]}</div>
              <div className="count-big" style={{ color: "var(--warn)" }}>{fmt(koCost - enCost)}</div>
              <div className="count-unit">{enTok > 0 ? (koTok / enTok).toFixed(1) : "–"}×</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
