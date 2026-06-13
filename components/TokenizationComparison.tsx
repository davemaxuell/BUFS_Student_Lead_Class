"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { charTokens, wordTokens, subwordTokens, showWhitespace } from "@/lib/tokenize";
import { NumberedChip } from "@/lib/chip";

const EXAMPLES: { label: string; text: string }[] = [
  { label: "EN", text: "Tokenization isn't always intuitive!" },
  { label: "KR", text: "학교에서 자연어를 공부해요." },
  { label: "Mixed", text: "GPT는 한국어를 byte로 쪼개요 😅" },
];

export default function TokenizationComparison() {
  const { lang } = useLang();
  const [text, setText] = useState(EXAMPLES[1].text);

  const chars = useMemo(() => charTokens(text), [text]);
  const words = useMemo(() => wordTokens(text), [text]);
  const subs = useMemo(() => subwordTokens(text), [text]);

  const t = S.tok;

  return (
    <section id="tokenize">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="card" style={{ marginTop: 18 }}>
          <label className="label">{t.inputLabel[lang]}</label>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="btnrow">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="preset" onClick={() => setText(ex.text)}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid3">
          {/* Character */}
          <div className="card">
            <h3>{t.charTitle[lang]} <span className="count-unit">{t.charKo[lang]}</span></h3>
            <div className="method-count">
              <b>{chars.length}</b> <span className="count-unit">{t.units[lang]}</span>
            </div>
            <div className="chips">
              {chars.map((c, i) => (
                <NumberedChip key={i} i={i}>{showWhitespace(c)}</NumberedChip>
              ))}
            </div>
            <p className="desc" style={{ marginTop: 10 }}>{t.charDesc[lang]}</p>
          </div>

          {/* Word */}
          <div className="card">
            <h3>{t.wordTitle[lang]} <span className="count-unit">{t.wordKo[lang]}</span></h3>
            <div className="method-count">
              <b>{words.length}</b> <span className="count-unit">{t.units[lang]}</span>
            </div>
            <div className="chips">
              {words.map((w, i) => (
                <NumberedChip key={i} i={i}>{showWhitespace(w)}</NumberedChip>
              ))}
            </div>
            <p className="desc" style={{ marginTop: 10 }}>{t.wordDesc[lang]}</p>
          </div>

          {/* Subword */}
          <div className="card">
            <h3>{t.subTitle[lang]} <span className="count-unit">{t.subKo[lang]}</span></h3>
            <div className="method-count">
              <b>{subs.length}</b> <span className="count-unit">{t.units[lang]}</span>
            </div>
            <div className="chips">
              {subs.map((s, i) => (
                <NumberedChip key={i} i={i} broken={s.broken} title={`id ${s.id}`}>
                  {s.broken ? "⟨byte⟩" : showWhitespace(s.text)}
                </NumberedChip>
              ))}
            </div>
            <p className="desc" style={{ marginTop: 10 }}>{t.subDesc[lang]}</p>
          </div>
        </div>

        <div className="callout">{t.note[lang]}</div>

        {/* Trade-off table */}
        <h3 style={{ marginTop: 28 }}>{t.table.head[lang]}</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t.charTitle[lang]}</th>
              <th>{t.wordTitle[lang]}</th>
              <th>{t.subTitle[lang]}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t.table.vocab[lang]}</td>
              <td>{t.table.tiny[lang]}</td>
              <td>{t.table.huge[lang]}</td>
              <td>{t.table.medium[lang]}</td>
            </tr>
            <tr>
              <td>{t.table.unk[lang]}</td>
              <td>{t.table.never[lang]}</td>
              <td>{t.table.often[lang]}</td>
              <td>{t.table.rare[lang]}</td>
            </tr>
            <tr>
              <td>{t.table.len[lang]}</td>
              <td>{t.table.long[lang]}</td>
              <td>{t.table.short[lang]}</td>
              <td>{t.table.med[lang]}</td>
            </tr>
            <tr>
              <td>{t.table.used[lang]}</td>
              <td>{t.table.cRare[lang]}</td>
              <td>{t.table.cOld[lang]}</td>
              <td>{t.table.cMod[lang]}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
