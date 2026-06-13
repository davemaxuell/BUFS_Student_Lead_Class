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
  const rafRef = useRef(0);
  const seedRef = useRef(2);

  const snapshot = () => setCoords(model.vec.map((r) => [...r]));

  const runEpochs = (n: number) => {
    let d = dist;
    for (let i = 0; i < n; i++) d = model.trainEpoch(0.02, 4);
    setEpoch((e) => e + n);
    setDist(d);
    snapshot();
  };
  const runRef = useRef(runEpochs);
  runRef.current = runEpochs;

  useEffect(() => {
    if (!playing) return;
    let stop = false;
    const tick = () => {
      if (stop) return;
      runRef.current(1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const reset = () => {
    setPlaying(false);
    seedRef.current += 1;
    model.reset(seedRef.current);
    setEpoch(0);
    setDist(0);
    snapshot();
  };

  // project to screen, auto-scaled to fit
  const pts = useMemo(() => {
    let maxAbs = 0.001;
    for (const c of coords) maxAbs = Math.max(maxAbs, Math.abs(c[0]), Math.abs(c[1]));
    return coords.map((c, i) => ({
      i,
      sx: W / 2 + (c[0] / maxAbs) * (W / 2 - 40),
      sy: H / 2 - (c[1] / maxAbs) * (H / 2 - 30),
    }));
  }, [coords]);

  const neighbors = useMemo(() => model.nearest(sel, 3), [sel, coords, model]);
  const nbSet = new Set(neighbors.map((n) => n.j));

  const narration =
    epoch === 0 ? t.nStart[lang] : epoch < 60 ? t.nLearn[lang] : t.nDone[lang];

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
          <button className="lang-btn" onClick={() => setPlaying((p) => !p)}>{playing ? t.pause[lang] : t.play[lang]}</button>
          <button className="preset" onClick={() => { setPlaying(false); runEpochs(15); }}>{t.step[lang]}</button>
          <button className="preset" onClick={reset}>{t.reset[lang]}</button>
          <span className="count-unit" style={{ alignSelf: "center" }}>
            {t.epoch[lang]} {epoch} · {t.dist[lang]} <b style={{ color: "#ffb454" }}>{dist.toFixed(2)}</b>
          </span>
        </div>

        <div className="callout">{narration}</div>

        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="card">
            <div className="label">{t.plotTitle[lang]}</div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid var(--line)", background: "#0d1430" }}>
              {sel !== null &&
                neighbors.map((n) => {
                  const a = pts[sel];
                  const b = pts[n.j];
                  return <line key={n.j} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#58e0c8" strokeWidth={1} strokeDasharray="3 3" />;
                })}
              {pts.map((p) => {
                const active = sel === p.i;
                const nb = nbSet.has(p.i);
                const col = COLORS[model.group[p.i]];
                const op = sel === null || active || nb ? 1 : 0.55;
                return (
                  <g key={p.i} onClick={() => setSel(p.i)} style={{ cursor: "pointer" }} opacity={op}>
                    <circle cx={p.sx} cy={p.sy} r={active ? 7 : 5} fill={col} stroke={active ? "#fff" : "none"} strokeWidth={active ? 2 : 0} />
                    <text x={p.sx + 8} y={p.sy + 4} fontSize={12} fontWeight={active || nb ? 700 : 500} fill={active || nb ? "#e9edff" : "#aab4dd"}>
                      {model.words[p.i]}
                    </text>
                  </g>
                );
              })}
            </svg>
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
      </div>
    </section>
  );
}
