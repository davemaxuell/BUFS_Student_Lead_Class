"use client";

import { useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadFillMask } from "@/lib/fillMask";

type Status = "idle" | "loading" | "ready" | "error";
type Pred = { word: string; score: number };

const EX_EN = "The capital of France is [MASK].";
const EX_KR = "서울은 [MASK]의 수도입니다.";

export default function MLMDemo() {
  const { lang } = useLang();
  const t = S.mlm;
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState(EX_EN);
  const [preds, setPreds] = useState<Pred[]>([]);
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pipe, setPipe] = useState<any>(null);

  const runOn = async (p: any, sentence: string) => {
    if (!p || !sentence.includes("[MASK]")) {
      setPreds([]);
      return;
    }
    setBusy(true);
    try {
      const out = await p(sentence, { topk: 5 });
      setPreds(out.map((o: any) => ({ word: o.token_str, score: o.score })));
    } catch {
      setPreds([]);
    }
    setBusy(false);
  };

  const load = () => {
    setStatus("loading");
    loadFillMask()
      .then((p) => {
        setPipe(p);
        setStatus("ready");
        runOn(p, text);
      })
      .catch(() => setStatus("error"));
  };

  const hasMask = text.includes("[MASK]");
  const maxScore = preds.length ? Math.max(...preds.map((p) => p.score)) : 1;

  return (
    <section id="mlm">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        {status === "idle" && (
          <button className="lang-btn" style={{ marginTop: 14 }} onClick={load}>{t.loadBtn[lang]}</button>
        )}
        {status === "loading" && <p className="lead" style={{ marginTop: 14 }}>⏳ {t.loading[lang]}</p>}
        {status === "error" && (
          <div className="callout" style={{ borderLeftColor: "var(--danger)" }}>
            {t.error[lang]} <button className="preset" onClick={load}>{t.retry[lang]}</button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="card" style={{ marginTop: 16 }}>
              <label className="label">{t.inputLabel[lang]}</label>
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="btnrow">
                <button className="lang-btn" onClick={() => runOn(pipe, text)} disabled={!hasMask || busy}>
                  {busy ? t.predicting[lang] : t.predict[lang]}
                </button>
                {!hasMask && (
                  <button className="preset" onClick={() => setText((s) => s + " [MASK]")}>{t.insertMask[lang]}</button>
                )}
                <button className="preset" onClick={() => { setText(EX_EN); runOn(pipe, EX_EN); }}>{t.presetEn[lang]}</button>
                <button className="preset" onClick={() => { setText(EX_KR); runOn(pipe, EX_KR); }}>{t.presetKr[lang]}</button>
              </div>
              {!hasMask && <div className="note">{t.maskHint[lang]}</div>}
            </div>

            {preds.length > 0 && (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="label">{t.results[lang]}</div>
                {preds.map((p, i) => (
                  <div className="bar-row" key={i} style={{ gridTemplateColumns: "120px 1fr 64px" }}>
                    <div className="bar-label" style={{ fontFamily: "ui-monospace, monospace" }}>{p.word}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max((p.score / maxScore) * 100, 3)}%` }} />
                    </div>
                    <div className="bar-meta">{(p.score * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}

            <div className="callout">{t.note[lang]}</div>
          </>
        )}
      </div>
    </section>
  );
}
