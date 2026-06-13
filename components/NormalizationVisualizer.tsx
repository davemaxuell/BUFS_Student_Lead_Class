"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";

function codePoints(s: string): number {
  return Array.from(s).length;
}
function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

function StringCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { lang } = useLang();
  return (
    <div className="card">
      <label className="label">{title}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <span className="count-unit">
          {codePoints(value)} {S.norm.codepoints[lang]} · {byteLen(value)} bytes
        </span>
      </div>
    </div>
  );
}

const FORMS = ["NFC", "NFD", "NFKC", "NFKD"] as const;

export default function NormalizationVisualizer() {
  const { lang } = useLang();
  const [a, setA] = useState("한글");
  const [b, setB] = useState("한글".normalize("NFD"));

  const rawEqual = a === b;
  const nfcEqual = a.normalize("NFC") === b.normalize("NFC");

  const formsA = useMemo(
    () =>
      FORMS.map((f) => {
        const v = a.normalize(f);
        return { f, v, cp: codePoints(v) };
      }),
    [a]
  );

  const n = S.norm;
  const pill = (ok: boolean) => (
    <span className={"pill " + (ok ? "yes" : "no")}>{ok ? n.yes[lang] : n.no[lang]}</span>
  );

  return (
    <section id="normalize">
      <div className="container">
        <div className="eyebrow">{n.eyebrow[lang]}</div>
        <h2>{n.title[lang]}</h2>
        <p className="lead">{n.intro[lang]}</p>

        <div className="grid2" style={{ marginTop: 18 }}>
          <StringCard title={n.aLabel[lang]} value={a} onChange={setA} />
          <StringCard title={n.bLabel[lang]} value={b} onChange={setB} />
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="kv">
            <span>{n.rawEqual[lang]}</span>
            {pill(rawEqual)}
          </div>
          <div className="kv" style={{ borderBottom: "none" }}>
            <span>{n.normEqual[lang]}</span>
            {pill(nfcEqual)}
          </div>
        </div>

        <div className="btnrow">
          <span className="count-unit" style={{ alignSelf: "center" }}>{n.tryThis[lang]}</span>
          <button
            className="preset"
            onClick={() => {
              setA("한글");
              setB("한글".normalize("NFD"));
            }}
          >
            {n.presets.koComposed[lang]}
          </button>
          <button
            className="preset"
            onClick={() => {
              setA("café");
              setB("café".normalize("NFD"));
            }}
          >
            {n.presets.cafe[lang]}
          </button>
          <button
            className="preset"
            onClick={() => {
              setA("Seoul");
              setB("seoul ");
            }}
          >
            {n.presets.case[lang]}
          </button>
        </div>

        {/* The four Unicode forms of String A */}
        <h3 style={{ marginTop: 24 }}>{n.forms[lang]} — “{a}”</h3>
        <table>
          <tbody>
            {formsA.map((row) => (
              <tr key={row.f}>
                <td style={{ width: 80 }}>{row.f}</td>
                <td className="mono">{Array.from(row.v).map((c) => "U+" + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")).join(" ")}</td>
                <td style={{ width: 110, textAlign: "right" }} className="count-unit">
                  {row.cp} {S.norm.codepoints[lang]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="callout">{n.lesson[lang]}</div>
      </div>
    </section>
  );
}
