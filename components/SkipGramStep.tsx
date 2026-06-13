"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { SkipGram } from "@/lib/skipgram";

const COLORS = ["#7c9cff", "#5fe08a", "#ffb454", "#ff7a90"];
const LR = 0.2;
const NSTAGE = 8;
const STAGE_KEYS = ["st0", "st1", "st2", "st3", "st4", "st5", "st6", "st7"] as const;

export default function SkipGramStep() {
  const { lang } = useLang();
  const t = S.sg;

  const ref = useRef<SkipGram | null>(null);
  if (!ref.current) ref.current = new SkipGram();
  const m = ref.current;

  const [center, setCenter] = useState(0); // "king"
  const [ctx, setCtx] = useState(() => m.contexts(0)[0] ?? 1);
  const [phase, setPhase] = useState(0);
  const [iter, setIter] = useState(0);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1× / 2× / 4× auto speed
  const [pre, setPre] = useState<{ old: number[]; lossOld: number; lossNew: number } | null>(null);
  const seedRef = useRef(2);

  // everything for the current (center → ctx) example, recomputed after updates
  const info = useMemo(() => m.compute(center, ctx), [center, ctx, tick, m]);
  const Esnap = useMemo(() => m.E.map((r) => [...r]), [tick]);

  const next = () => {
    if (phase === 6) {
      const old = [m.E[center][0], m.E[center][1]];
      const lossOld = info.loss;
      m.applyUpdate(center, ctx, LR);
      const lossNew = m.compute(center, ctx).loss;
      setPre({ old, lossOld, lossNew });
      setIter((i) => i + 1);
      setTick((x) => x + 1);
      setPhase(7);
      return;
    }
    if (phase < 7) {
      setPhase(phase + 1);
      return;
    }
    const cs = m.contexts(center);
    setCtx(cs[(cs.indexOf(ctx) + 1) % cs.length]);
    setPhase(0);
  };

  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => nextRef.current(), Math.round(1600 / speed));
    return () => clearInterval(id);
  }, [playing, speed]);

  const pickCenter = (c: number) => {
    setPlaying(false);
    setCenter(c);
    setCtx(m.contexts(c)[0]);
    setPhase(0);
    setPre(null);
  };
  const cycleCtx = () => {
    const cs = m.contexts(center);
    setCtx(cs[(cs.indexOf(ctx) + 1) % cs.length]);
    setPhase(0);
    setPre(null);
  };
  const reset = () => {
    setPlaying(false);
    seedRef.current += 1;
    m.reset(seedRef.current);
    setCenter(0);
    setCtx(m.contexts(0)[0]);
    setPhase(0);
    setIter(0);
    setPre(null);
    setTick((x) => x + 1);
  };

  // 2-D plot of the input embeddings E
  const pts = useMemo(() => {
    let mx = 1e-3;
    for (const c of Esnap) mx = Math.max(mx, Math.abs(c[0]), Math.abs(c[1]));
    return Esnap.map((c, i) => ({ i, sx: 110 + (c[0] / mx) * 92, sy: 110 - (c[1] / mx) * 92 }));
  }, [Esnap]);

  // compact bar strip over the whole vocabulary
  const Bars = ({ vals, mode }: { vals: number[]; mode: "prob" | "signed" }) => {
    const w = 380;
    const h = 90;
    const n = vals.length;
    const bw = w / n;
    const max = mode === "prob" ? Math.max(1e-6, ...vals) : Math.max(1e-6, ...vals.map((v) => Math.abs(v)));
    const base = mode === "prob" ? h - 16 : h / 2;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
        {mode === "signed" && <line x1={0} y1={base} x2={w} y2={base} stroke="var(--line)" strokeWidth={1} />}
        {vals.map((v, k) => {
          const bh = mode === "prob" ? (v / max) * (h - 28) : (v / max) * (h / 2 - 8);
          const isHi = k === ctx;
          const col = isHi ? "#5fe08a" : mode === "signed" && v < 0 ? "#ff7a90" : "#7c9cff";
          const y = mode === "prob" ? base - bh : v >= 0 ? base - bh : base;
          return <rect key={k} x={k * bw + 0.5} y={y} width={Math.max(bw - 1, 1)} height={Math.max(Math.abs(bh), 0.5)} fill={col} opacity={isHi ? 1 : 0.55} />;
        })}
        {/* mark the true context token */}
        <text x={ctx * bw + bw / 2} y={mode === "prob" ? h - 4 : base + 12} fontSize={8} fill="#5fe08a" fontWeight={700} textAnchor="middle">{m.words[ctx]}</text>
      </svg>
    );
  };

  const newE = [m.E[center][0] - LR * info.dE[0], m.E[center][1] - LR * info.dE[1]];
  const fmtVec = (v: number[]) => `[ ${v[0].toFixed(2)}, ${v[1].toFixed(2)} ]`;

  const content = () => {
    switch (phase) {
      case 0:
        return (
          <div className="chips">
            {m.words.map((w, i) => (
              <span key={i} className="chip" style={i === center ? { background: COLORS[m.group[i]] + "44", borderColor: COLORS[m.group[i]], color: "#fff", fontWeight: 700 } : { opacity: 0.5, fontSize: ".8rem" }}>{w}</span>
            ))}
          </div>
        );
      case 1:
        return (
          <div style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums", fontSize: "1.05rem" }}>
            E[ #{center} ] = <b style={{ color: "#e9edff" }}>{fmtVec(m.E[center])}</b>
          </div>
        );
      case 2:
        return (
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            <table style={{ fontFamily: "ui-monospace, monospace", fontSize: ".82rem", fontVariantNumeric: "tabular-nums", width: "100%" }}>
              <thead><tr><th style={{ textAlign: "left" }}>id</th><th style={{ textAlign: "left" }}>token</th><th style={{ textAlign: "right" }}>w₀</th><th style={{ textAlign: "right" }}>w₁</th></tr></thead>
              <tbody>
                {m.words.map((w, i) => (
                  <tr key={i} style={i === ctx ? { background: "#16351f" } : undefined}>
                    <td style={{ color: COLORS[m.group[i]] }}>{i}</td>
                    <td style={{ color: "#e9edff" }}>{w}</td>
                    <td style={{ textAlign: "right", color: "#9aa6d6" }}>{m.W[i][0].toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "#9aa6d6" }}>{m.W[i][1].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 3:
        return (<>
          <div className="note" style={{ marginTop: 0 }}>{t.scoresFormula[lang]}</div>
          <Bars vals={info.scores} mode="signed" />
        </>);
      case 4:
        return (<>
          <Bars vals={info.probs} mode="prob" />
          <div style={{ fontFamily: "ui-monospace, monospace", marginTop: 6 }}>p(<b style={{ color: "#5fe08a" }}>{m.words[ctx]}</b>) = <b style={{ color: "#5fe08a" }}>{(info.probs[ctx] * 100).toFixed(1)}%</b> · Σp = 1.00</div>
        </>);
      case 5:
        return (
          <div style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums", fontSize: "1.05rem" }}>
            loss = −log p(<b style={{ color: "#5fe08a" }}>{m.words[ctx]}</b>) = −log({info.probs[ctx].toFixed(3)}) = <b style={{ color: "#ffb454" }}>{info.loss.toFixed(3)}</b>
          </div>
        );
      case 6:
        return (<>
          <div className="note" style={{ marginTop: 0 }}>{t.backpropNote[lang]}</div>
          <Bars vals={info.dscore} mode="signed" />
          <div style={{ fontFamily: "ui-monospace, monospace", marginTop: 6 }}>∂loss/∂E[{m.words[center]}] = <b style={{ color: "#ffb454" }}>{fmtVec(info.dE)}</b></div>
        </>);
      default:
        return (
          <div style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums", lineHeight: 1.7 }}>
            <div>E[{m.words[center]}]: <span style={{ color: "#9aa6d6" }}>{pre ? fmtVec(pre.old) : ""}</span> → <b style={{ color: "#5fe08a" }}>{fmtVec(m.E[center])}</b></div>
            <div>loss: <span style={{ color: "#9aa6d6" }}>{pre ? pre.lossOld.toFixed(3) : ""}</span> → <b style={{ color: "#5fe08a" }}>{pre ? pre.lossNew.toFixed(3) : ""}</b> ↓</div>
            <div className="note">{t.updateNote[lang]}</div>
          </div>
        );
    }
  };

  return (
    <section id="skipgram">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        {/* center selector + the example */}
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span className="count-unit">{t.center[lang]}:</span>
            <select value={center} onChange={(e) => pickCenter(+e.target.value)} style={{ minWidth: 120 }}>
              {m.words.map((w, i) => <option key={i} value={i}>{i} · {w}</option>)}
            </select>
            <span className="count-unit">{t.context[lang]}:</span>
            <span className="chip" style={{ background: "#5fe08a33", borderColor: "#5fe08a", color: "#fff" }}>{m.words[ctx]}</span>
            <button className="preset" onClick={cycleCtx}>{t.changeCtx[lang]}</button>
          </div>
          <div className="note">{t.exampleNote[lang]}</div>
        </div>

        <div className="btnrow" style={{ marginTop: 12 }}>
          <button className="lang-btn" onClick={next}>{t.next[lang]}</button>
          <button className="preset" onClick={() => setPlaying((p) => !p)}>{playing ? t.pause[lang] : t.play[lang]}</button>
          <button className="preset" onClick={() => setSpeed((s) => (s >= 4 ? 1 : s * 2))}>{t.speed[lang]} {speed}×</button>
          <button className="preset" onClick={reset}>{t.reset[lang]}</button>
          <span className="count-unit" style={{ alignSelf: "center" }}>{t.iter[lang]} {iter}</span>
        </div>

        {/* pipeline strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
          {STAGE_KEYS.map((k, i) => (
            <span key={k} className="chip" style={{
              fontSize: ".74rem",
              borderColor: i === phase ? "var(--accent)" : "var(--line)",
              background: i === phase ? "var(--accent)" : "transparent",
              color: i === phase ? "#0b1020" : "var(--muted)",
              fontWeight: i === phase ? 800 : 500,
            }}>{i + 1}·{t[k][lang]}</span>
          ))}
        </div>

        <div className="callout">{t[("n" + phase) as "n0"][lang]}</div>

        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="card">
            <div className="label">{phase + 1} · {t[STAGE_KEYS[phase]][lang]}</div>
            {content()}
          </div>
          <div className="card">
            <div className="label">{t.plotTitle[lang]}</div>
            <svg viewBox="0 0 220 220" style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid var(--line)", background: "#0d1430" }}>
              {(() => {
                const a = pts[center];
                const b = pts[ctx];
                return a && b ? <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#5fe08a" strokeWidth={1.4} strokeDasharray="3 3" /> : null;
              })()}
              {pts.map((p) => {
                const isC = p.i === center;
                const isT = p.i === ctx;
                return (
                  <g key={p.i} onClick={() => pickCenter(p.i)} style={{ cursor: "pointer" }}>
                    <circle cx={p.sx} cy={p.sy} r={isC ? 6 : isT ? 5 : 3.5} fill={COLORS[m.group[p.i]]} stroke={isC ? "#fff" : isT ? "#5fe08a" : "none"} strokeWidth={isC || isT ? 2 : 0} opacity={isC || isT ? 1 : 0.5} />
                    {(isC || isT) && <text x={p.sx + 7} y={p.sy + 3} fontSize={10} fontWeight={700} fill="#e9edff">{m.words[p.i]}</text>}
                  </g>
                );
              })}
            </svg>
            <div className="note">{t.plotNote[lang]}</div>
          </div>
        </div>

        <div className="callout" style={{ borderLeftColor: "var(--accent2)" }}>{t.bridge[lang]}</div>
      </div>
    </section>
  );
}
