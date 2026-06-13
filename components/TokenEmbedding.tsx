"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { EmbModel } from "@/lib/embedTrain";

const COLORS = ["#7c9cff", "#5fe08a", "#ffb454", "#ff7a90"]; // by topic, for color only
const W = 440;
const H = 360;

export default function TokenEmbedding() {
  const { lang } = useLang();
  const t = S.emblearn;

  const modelRef = useRef<EmbModel | null>(null);
  if (!modelRef.current) modelRef.current = new EmbModel(); // deterministic init (SSR-safe)
  const model = modelRef.current;

  const [coords, setCoords] = useState<number[][]>(() => model.vec.map((r) => [...r]));
  const [epoch, setEpoch] = useState(0);
  const [dist, setDist] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState<number>(0); // default: first token ("king")
  const [focus, setFocus] = useState<{ i: number; j: number; pPos: number; negs: { n: number; p: number }[] } | null>(null);
  const seedRef = useRef(2);
  const pairIdxRef = useRef(0);
  const dispRef = useRef<number[][]>(model.vec.map((r) => [...r])); // smoothed display positions
  const scaleRef = useRef(0.6);

  const runEpochs = (n: number) => {
    setFocus(null);
    let d = dist;
    for (let i = 0; i < n; i++) d = model.trainEpoch(0.3, 6);
    setEpoch((e) => e + n);
    setDist(d);
    // the render loop eases the dots toward model.vec, so motion stays smooth
  };

  // One co-occurring pair, with the pull/push forces drawn out.
  const stepPair = () => {
    setPlaying(false);
    const p = model.pairs[pairIdxRef.current % model.pairs.length];
    pairIdxRef.current++;
    const negs = model.sampleNegatives(p[0], 3); // true non-neighbors only
    const info = model.trainPair(p[0], p[1], negs, 0.8);
    setFocus({ i: p[0], j: p[1], pPos: info.pPos, negs: info.negs });
    setSel(p[0]);
  };
  const runRef = useRef(runEpochs);
  runRef.current = runEpochs;

  // training advances at a watchable pace (~11 epochs/s) when playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => runRef.current(1), 90);
    return () => clearInterval(id);
  }, [playing]);

  // render loop: the dots GLIDE toward the trained positions every frame, so the
  // motion looks like smooth, natural settling instead of jumpy snapping.
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const v = model.vec;
      const d = dispRef.current;
      let moved = false;
      for (let i = 0; i < v.length; i++) {
        for (let k = 0; k < 2; k++) {
          const diff = v[i][k] - d[i][k];
          if (Math.abs(diff) > 1e-3) {
            d[i][k] += diff * 0.12;
            moved = true;
          } else {
            d[i][k] = v[i][k];
          }
        }
      }
      if (moved) setCoords(d.map((r) => [...r]));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [model]);

  const reset = () => {
    setPlaying(false);
    setFocus(null);
    pairIdxRef.current = 0;
    seedRef.current += 1;
    model.reset(seedRef.current);
    dispRef.current = model.vec.map((r) => [...r]);
    scaleRef.current = 0.6;
    setCoords(dispRef.current.map((r) => [...r]));
    setEpoch(0);
    setDist(0);
  };

  // Monotonic, only-growing scale so the cloud never "breathes"/zooms in and out.
  const pts = useMemo(() => {
    let target = 0.001;
    for (const c of coords) target = Math.max(target, Math.abs(c[0]), Math.abs(c[1]));
    scaleRef.current = Math.max(scaleRef.current, target * 1.06);
    const s = scaleRef.current;
    return coords.map((c, i) => ({
      i,
      sx: W / 2 + (c[0] / s) * (W / 2 - 40),
      sy: H / 2 - (c[1] / s) * (H / 2 - 30),
    }));
  }, [coords]);

  const neighbors = useMemo(() => model.nearest(sel, 3), [sel, coords, model]);
  const nbSet = new Set(neighbors.map((n) => n.j));

  const narration =
    epoch === 0 ? t.nStart[lang] : epoch < 120 ? t.nLearn[lang] : t.nDone[lang];

  const selVec = coords[sel] || [0, 0];

  return (
    <section id="embedlearn">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="callout">{t.how[lang]}</div>

        {/* token -> id -> vector lookup readout */}
        <div className="card" style={{ marginTop: 12 }}>
          <div className="label">{t.lookup[lang]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>
            <span className="chip" style={{ background: COLORS[model.group[sel]] + "33", borderColor: COLORS[model.group[sel]], color: "#fff" }}>{model.words[sel]}</span>
            <span className="count-unit">→ {t.id[lang]} #{sel}</span>
            <span className="count-unit">→ {t.vector[lang]}</span>
            <b style={{ color: "#e9edff" }}>[ {selVec[0].toFixed(2)}, {selVec[1].toFixed(2)} ]</b>
          </div>
          <div className="note">{t.lookupNote[lang]}</div>
        </div>

        <div className="btnrow" style={{ marginTop: 14 }}>
          <button className="lang-btn" onClick={() => { setFocus(null); setPlaying((p) => !p); }}>{playing ? t.pause[lang] : t.play[lang]}</button>
          <button className="preset" onClick={stepPair}>{t.onePair[lang]}</button>
          <button className="preset" onClick={() => { setPlaying(false); runEpochs(15); }}>{t.step[lang]}</button>
          <button className="preset" onClick={reset}>{t.reset[lang]}</button>
          <span className="count-unit" style={{ alignSelf: "center" }}>
            {t.epoch[lang]} {epoch} · {t.dist[lang]} <b style={{ color: "#ffb454" }}>{dist.toFixed(2)}</b>
          </span>
        </div>

        <div className="callout">{narration}</div>

        {focus && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="label">{t.stepTitle[lang]}</div>
            <div className="note" style={{ marginTop: 0, marginBottom: 8 }}>{t.stepTask[lang]}</div>
            <table style={{ width: "100%", fontSize: ".88rem", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr>
                  <th>{t.thPair[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.thTruth[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.thPred[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.thErr[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.thAction[lang]}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: "#e9edff" }}>{model.words[focus.i]} &amp; {model.words[focus.j]}</td>
                  <td style={{ textAlign: "right" }}>1</td>
                  <td style={{ textAlign: "right" }}>{(focus.pPos * 100).toFixed(0)}%</td>
                  <td style={{ textAlign: "right", color: "#ffb454" }}>{(1 - focus.pPos).toFixed(2)}</td>
                  <td style={{ textAlign: "right", color: "#5fe08a", fontWeight: 700 }}>↓ {t.pull[lang]}</td>
                </tr>
                {focus.negs.map(({ n, p }) => (
                  <tr key={n}>
                    <td style={{ color: "#aab4dd" }}>{model.words[focus.i]} &amp; {model.words[n]}</td>
                    <td style={{ textAlign: "right" }}>0</td>
                    <td style={{ textAlign: "right" }}>{(p * 100).toFixed(0)}%</td>
                    <td style={{ textAlign: "right", color: "#ffb454" }}>{(0 - p).toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "#ff7a90", fontWeight: 700 }}>↑ {t.push[lang]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="card">
            <div className="label">{t.plotTitle[lang]}</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid var(--line)", background: "#0d1430" }}>
              <defs>
                <marker id="arrPull" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#5fe08a" />
                </marker>
                <marker id="arrPush" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ff7a90" />
                </marker>
              </defs>

              {/* training forces for the focused pair */}
              {focus &&
                focus.negs.map(({ n }) => (
                  <line key={"push" + n} x1={pts[focus.i].sx} y1={pts[focus.i].sy} x2={pts[n].sx} y2={pts[n].sy} stroke="#ff7a90" strokeWidth={1.4} strokeDasharray="4 3" markerEnd="url(#arrPush)" opacity={0.8} />
                ))}
              {focus && (
                <line x1={pts[focus.i].sx} y1={pts[focus.i].sy} x2={pts[focus.j].sx} y2={pts[focus.j].sy} stroke="#5fe08a" strokeWidth={2.4} markerStart="url(#arrPull)" markerEnd="url(#arrPull)" />
              )}

              {/* nearest-neighbor hints (only when not showing a training step) */}
              {!focus &&
                sel !== null &&
                neighbors.map((n) => {
                  const a = pts[sel];
                  const b = pts[n.j];
                  return <line key={n.j} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#58e0c8" strokeWidth={1} strokeDasharray="3 3" />;
                })}
              {pts.map((p) => {
                const pulled = focus ? focus.i === p.i || focus.j === p.i : false;
                const pushed = focus ? focus.negs.some((o) => o.n === p.i) : false;
                const active = sel === p.i;
                const nb = nbSet.has(p.i);
                const ring = pulled ? "#5fe08a" : pushed ? "#ff7a90" : active ? "#fff" : "none";
                const lit = focus ? pulled || pushed : sel === null || active || nb;
                const col = COLORS[model.group[p.i]];
                const op = lit ? 1 : focus ? 0.3 : 0.55;
                return (
                  <g key={p.i} onClick={() => setSel(p.i)} style={{ cursor: "pointer" }} opacity={op}>
                    <circle cx={p.sx} cy={p.sy} r={pulled || pushed || active ? 7 : 5} fill={col} stroke={ring} strokeWidth={ring === "none" ? 0 : 2.4} />
                    <text x={p.sx + 8} y={p.sy + 4} fontSize={12} fontWeight={lit ? 700 : 500} fill={lit ? "#e9edff" : "#aab4dd"}>
                      {model.words[p.i]}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: ".8rem", flexWrap: "wrap" }}>
              <span><span style={{ display: "inline-block", width: 14, height: 0, borderTop: "3px solid #5fe08a", verticalAlign: "middle", marginRight: 5 }} />{t.legendPull[lang]}</span>
              <span><span style={{ display: "inline-block", width: 14, height: 0, borderTop: "3px dashed #ff7a90", verticalAlign: "middle", marginRight: 5 }} />{t.legendPush[lang]}</span>
            </div>
            <div className="note">{t.plotNote[lang]}</div>
          </div>

          <div className="card">
            <div className="label">{t.tableTitle[lang]}</div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table style={{ fontFamily: "ui-monospace, monospace", fontSize: ".86rem", fontVariantNumeric: "tabular-nums", width: "100%" }}>
                <tbody>
                  {coords.map((c, i) => (
                    <tr key={i} onClick={() => setSel(i)} style={{ cursor: "pointer", background: sel === i ? "#1b2752" : "transparent" }}>
                      <td style={{ width: 14 }}><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: COLORS[model.group[i]] }} /></td>
                      <td style={{ color: "#e9edff" }}>{model.words[i]}</td>
                      <td style={{ textAlign: "right", color: "#9aa6d6" }}>{c[0].toFixed(2)}</td>
                      <td style={{ textAlign: "right", color: "#9aa6d6" }}>{c[1].toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {sel !== null && (
          <div className="callout">
            <b style={{ color: COLORS[model.group[sel]] }}>{model.words[sel]}</b> — {t.closest[lang]}:{" "}
            {neighbors.map((n) => model.words[n.j]).join(", ")}
          </div>
        )}

        <div className="callout" style={{ borderLeftColor: "var(--accent2)" }}>{t.encoderBridge[lang]}</div>
      </div>
    </section>
  );
}
