"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadFillMask } from "@/lib/fillMask";
import { NumberedChip } from "@/lib/chip";

type Status = "idle" | "loading" | "ready" | "error";
type Pred = { word: string; score: number };

// The [MASK] is locked in the middle; students edit only the two sides.
const PRESETS = [
  { key: "en", prefix: "The capital of France is", suffix: "." },
  { key: "kr", prefix: "서울은", suffix: "의 수도입니다." },
  { key: "after", prefix: "The", suffix: " is barking loudly." },
] as const;

function buildSentence(prefix: string, suffix: string): string {
  return (prefix.trim() ? prefix.trimEnd() + " " : "") + "[MASK]" + suffix;
}

export default function MLMDemo() {
  const { lang } = useLang();
  const t = S.mlm;
  const [status, setStatus] = useState<Status>("loading");
  const [prefix, setPrefix] = useState<string>(PRESETS[0].prefix);
  const [suffix, setSuffix] = useState<string>(PRESETS[0].suffix);
  const [preds, setPreds] = useState<Pred[]>([]);
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeRef = useRef<any>(null);

  const sentence = buildSentence(prefix, suffix);

  // Tokenize live on every keystroke (instant — independent of the model debounce)
  // so the colored tokens under the blank update as the student edits.
  const tokens = useMemo<string[]>(() => {
    if (status !== "ready" || !pipeRef.current) return [];
    try {
      return pipeRef.current.tokenizer.tokenize(sentence);
    } catch {
      return [];
    }
  }, [sentence, status]);

  // Load the real model as soon as the page starts — no click needed.
  const load = () => {
    setStatus("loading");
    loadFillMask()
      .then((p) => {
        pipeRef.current = p;
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(() => {
    load();
  }, []);

  const run = async (sentenceToRun: string) => {
    const p = pipeRef.current;
    if (!p) return;
    setBusy(true);
    try {
      const out = await p(sentenceToRun, { topk: 6 });
      setPreds(out.map((o: { token_str: string; score: number }) => ({ word: o.token_str, score: o.score })));
    } catch {
      setPreds([]);
    }
    setBusy(false);
  };

  // Live, debounced: every edit re-runs the model so the percentages move.
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    if (status !== "ready") return;
    const id = setTimeout(() => runRef.current(sentence), 450);
    return () => clearTimeout(id);
  }, [sentence, status]);

  const maxScore = preds.length ? Math.max(...preds.map((p) => p.score)) : 1;

  const maskChip = (
    <span className="chip" style={{ background: "#ffb45433", borderColor: "#ffb454", borderStyle: "dashed", color: "#fff", whiteSpace: "nowrap", fontWeight: 700 }}>
      [MASK]
    </span>
  );

  return (
    <section id="mlm">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        {status === "loading" && <p className="lead" style={{ marginTop: 14 }}>{t.loading[lang]}</p>}
        {status === "error" && (
          <div className="callout" style={{ borderLeftColor: "var(--danger)" }}>
            {t.error[lang]} <button className="preset" onClick={load}>{t.retry[lang]}</button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="card" style={{ marginTop: 16 }}>
              <label className="label">{t.editLabel[lang]}</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={prefix}
                  placeholder={t.beforePh[lang]}
                  onChange={(e) => setPrefix(e.target.value)}
                  style={{ flex: "1 1 220px", minWidth: 140 }}
                  aria-label={t.beforePh[lang]}
                />
                {maskChip}
                <input
                  type="text"
                  value={suffix}
                  placeholder={t.afterPh[lang]}
                  onChange={(e) => setSuffix(e.target.value)}
                  style={{ flex: "1 1 160px", minWidth: 120 }}
                  aria-label={t.afterPh[lang]}
                />
              </div>

              {/* live colored tokenization, right under the blank being edited */}
              {tokens.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="count-unit" style={{ marginBottom: 4 }}>{t.tokenizedInline[lang]}</div>
                  <div className="chips">
                    {tokens.map((tk, i) =>
                      tk === "[MASK]" ? (
                        <span key={i} className="chip numbered" style={{ background: "#ffb45433", borderColor: "#ffb454", borderStyle: "dashed", color: "#fff" }}>
                          <span className="tok">[MASK]</span>
                          <span className="idx">{i + 1}</span>
                        </span>
                      ) : (
                        <NumberedChip key={i} i={i}>{tk}</NumberedChip>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="note">{t.lockedNote[lang]}</div>
              <div className="btnrow" style={{ marginTop: 10 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    className="preset"
                    onClick={() => { setPrefix(p.prefix); setSuffix(p.suffix); }}
                    style={prefix === p.prefix && suffix === p.suffix ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}
                  >
                    {t[("preset_" + p.key) as "preset_en"][lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="label">{t.results[lang]} {busy && <span className="count-unit">· {t.predicting[lang]}</span>}</div>
              {preds.length === 0 && <div className="count-unit">—</div>}
              {preds.map((p, i) => (
                <div className="bar-row" key={i} style={{ gridTemplateColumns: "minmax(140px,190px) 1fr 64px" }}>
                  <div className="bar-label" style={{ fontFamily: "ui-monospace, monospace" }} title={p.word}>{p.word}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max((p.score / maxScore) * 100, 3)}%` }} />
                  </div>
                  <div className="bar-meta">{(p.score * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>

            <div className="callout">{t.note[lang]}</div>
          </>
        )}
      </div>
    </section>
  );
}
