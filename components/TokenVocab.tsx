"use client";

import { useMemo } from "react";
import { S, useLang } from "@/lib/i18n";
import { DOCS, EmbModel } from "@/lib/embedTrain";

const COLORS = ["#7c9cff", "#5fe08a", "#ffb454", "#ff7a90"];
const N_SHOWN = 6; // illustrative columns; real N is far larger

// deterministic pseudo-random so server and client render identically
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function TokenVocab() {
  const { lang } = useLang();
  const t = S.embedvocab;

  // same vocabulary the live trainer uses
  const { words, group } = useMemo(() => {
    const m = new EmbModel();
    return { words: m.words, group: m.group };
  }, []);

  // illustrative random embedding matrix (rows = tokens, N columns)
  const matrix = useMemo(() => {
    const r = rng(7);
    return words.map(() => Array.from({ length: N_SHOWN }, () => +(r() * 2 - 1).toFixed(2)));
  }, [words]);

  const sampleDocs = DOCS.slice(0, 5);
  const shownRows = 8;

  return (
    <section id="embedvocab">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="grid2" style={{ marginTop: 16, alignItems: "start" }}>
          {/* Step 1 — label every token */}
          <div className="card">
            <div className="label">{t.step1[lang]}</div>
            <div className="note" style={{ marginTop: 0, marginBottom: 8 }}>{t.corpusLabel[lang]}</div>
            {sampleDocs.map((d, di) => (
              <div className="chips" key={di} style={{ margin: "2px 0" }}>
                {d.map((w, wi) => (
                  <span className="chip" key={wi} style={{ fontSize: ".8rem" }}>{w}</span>
                ))}
              </div>
            ))}
            <div className="note" style={{ marginTop: 10, marginBottom: 6 }}>{t.vocabLabel[lang]}</div>
            <div className="chips">
              {words.map((w, i) => (
                <span key={i} className="chip" style={{ background: COLORS[group[i]] + "22", borderColor: COLORS[group[i]] + "88", fontFamily: "ui-monospace, monospace", fontSize: ".8rem" }}>
                  <b style={{ color: COLORS[group[i]] }}>{i}</b>&nbsp;{w}
                </span>
              ))}
            </div>
            <div className="note">{t.step1Note[lang]}</div>
          </div>

          {/* Step 2 — give each ID a row of N numbers */}
          <div className="card">
            <div className="label">{t.step2[lang]}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ fontFamily: "ui-monospace, monospace", fontSize: ".8rem", fontVariantNumeric: "tabular-nums", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>{t.thId[lang]}</th>
                    <th style={{ textAlign: "left" }}>{t.thToken[lang]}</th>
                    {Array.from({ length: N_SHOWN }, (_, c) => (
                      <th key={c} style={{ textAlign: "right", color: "var(--muted)" }}>d{c + 1}</th>
                    ))}
                    <th style={{ textAlign: "right", color: "var(--muted)" }}>…</th>
                  </tr>
                </thead>
                <tbody>
                  {words.slice(0, shownRows).map((w, i) => (
                    <tr key={i}>
                      <td style={{ color: COLORS[group[i]], fontWeight: 700 }}>{i}</td>
                      <td style={{ color: "#e9edff" }}>{w}</td>
                      {matrix[i].map((v, c) => (
                        <td key={c} style={{ textAlign: "right", color: "var(--text)" }}>{v.toFixed(2)}</td>
                      ))}
                      <td style={{ textAlign: "right", color: "var(--muted)" }}>…</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={N_SHOWN + 3} style={{ textAlign: "center", color: "var(--muted)" }}>⋮ ({words.length} {t.rowsWord[lang]})</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="callout" style={{ marginTop: 10 }}>{t.dimNote[lang]}</div>
            <div className="note">{t.step2Note[lang]}</div>
          </div>
        </div>

        <div className="callout" style={{ borderLeftColor: "var(--accent2)" }}>{t.bridge[lang]}</div>
      </div>
    </section>
  );
}
