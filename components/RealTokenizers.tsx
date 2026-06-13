"use client";

import { useMemo, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadRealTokenizers, RealTok } from "@/lib/realTokenizers";

function Piece({ p }: { p: string }) {
  if (p.startsWith("##"))
    return <span className="chip"><span className="mark">##</span>{p.slice(2)}</span>;
  if (p.startsWith("▁"))
    return <span className="chip"><span className="mark">▁</span>{p.slice(1)}</span>;
  if (p.startsWith("Ġ"))
    return <span className="chip"><span className="mark">␣</span>{p.slice(1)}</span>;
  return <span className="chip">{p}</span>;
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
    () => toks.map((t) => ({ name: t.name, pieces: t.tokenize(text) })),
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
          <p className="lead" style={{ marginTop: 14 }}>⏳ {r.loading[lang]}</p>
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
                    <b>{res.pieces.length}</b> <span className="count-unit">{r.units[lang]}</span>
                  </div>
                  <div className="chips">
                    {res.pieces.map((p, i) => (
                      <Piece key={i} p={p} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="callout">{r.note[lang]}</div>
          </>
        )}
      </div>
    </section>
  );
}
