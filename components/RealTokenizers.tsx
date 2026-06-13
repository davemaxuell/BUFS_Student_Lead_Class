"use client";

import { useMemo, useState, ReactNode } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadRealTokenizers, RealTok } from "@/lib/realTokenizers";
import { NumberedChip } from "@/lib/chip";

// Render a token's content, highlighting the boundary marker (## / ▁ / space).
function pieceContent(p: string): ReactNode {
  if (p.startsWith("##")) return <><span className="mark">##</span>{p.slice(2)}</>;
  if (p.startsWith("▁")) return <><span className="mark">▁</span>{p.slice(1)}</>;
  if (p.startsWith("Ġ")) return <><span className="mark">␣</span>{p.slice(1)}</>;
  return p;
}

// A distinct chip for a start/end special token, labeled instead of numbered.
function SpecialChip({ token, label }: { token: string; label: string }) {
  return (
    <span className="chip special numbered">
      <span className="tok">{token}</span>
      <span className="idx">{label}</span>
    </span>
  );
}

type Status = "idle" | "loading" | "ready" | "error";

export default function RealTokenizers() {
  const { lang } = useLang();
  const r = S.real;
  const [status, setStatus] = useState<Status>("idle");
  const [toks, setToks] = useState<RealTok[]>([]);
  const [text, setText] = useState("학교에서 자연어를 공부해요. NLP is fun!");

  const load = () => {
    setStatus("loading");
    loadRealTokenizers()
      .then((t) => {
        setToks(t);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  const results = useMemo(
    () => toks.map((t) => ({ name: t.name, special: t.special, pieces: t.tokenize(text) })),
    [toks, text]
  );

  return (
    <section id="real">
      <div className="container">
        <div className="eyebrow">{r.eyebrow[lang]}</div>
        <h2>{r.title[lang]}</h2>
        <p className="lead">{r.intro[lang]}</p>

        {status === "idle" && (
          <button className="lang-btn" style={{ marginTop: 14 }} onClick={load}>
            {r.loadBtn[lang]}
          </button>
        )}
        {status === "loading" && (
          <p className="lead" style={{ marginTop: 14 }}>{r.loading[lang]}</p>
        )}
        {status === "error" && (
          <div className="callout" style={{ borderLeftColor: "var(--danger)" }}>
            {r.error[lang]}{" "}
            <button className="preset" onClick={load}>{r.retry[lang]}</button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="card" style={{ marginTop: 16 }}>
              <label className="label">{r.inputLabel[lang]}</label>
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="grid3">
              {results.map((res) => (
                <div className="card" key={res.name}>
                  <h3 style={{ fontSize: ".95rem" }}>{res.name}</h3>
                  <div className="method-count">
                    <b>{res.pieces.length}</b>{" "}
                    <span className="count-unit">
                      {r.units[lang]}
                      {res.special ? ` · ${res.pieces.length + 2} ${r.special.total[lang]}` : ""}
                    </span>
                  </div>
                  <div className="chips">
                    {res.special && <SpecialChip token={res.special.start} label={r.special.start[lang]} />}
                    {res.pieces.map((p, i) => (
                      <NumberedChip key={i} i={i}>{pieceContent(p)}</NumberedChip>
                    ))}
                    {res.special && <SpecialChip token={res.special.end} label={r.special.end[lang]} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="callout">{r.note[lang]}</div>
            <div className="callout" style={{ borderLeftColor: "var(--muted)" }}>{r.special.note[lang]}</div>
          </>
        )}
      </div>
    </section>
  );
}
