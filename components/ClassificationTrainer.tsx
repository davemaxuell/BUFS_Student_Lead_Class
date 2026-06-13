"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { MLP, makeDataset, Point, DatasetKind } from "@/lib/nn";

const COLA = [124, 156, 255]; // group 1 (blue)
const COLB = [255, 180, 84]; // group 2 (orange)
const SIZE = 380;
const GRID = 56;

export default function ClassificationTrainer() {
  const { lang } = useLang();
  const t = S.train;
  const netRef = useRef<MLP | null>(null);
  const dataRef = useRef<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [kind, setKind] = useState<DatasetKind>("moons");
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0);
  const [acc, setAcc] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hist, setHist] = useState<number[]>([]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const net = netRef.current;
    if (!cv || !net) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cell = SIZE / GRID;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = -1 + (2 * (i + 0.5)) / GRID;
        const y = 1 - (2 * (j + 0.5)) / GRID;
        const p = net.predict(x, y);
        const r = Math.round(COLA[0] * (1 - p) + COLB[0] * p);
        const g = Math.round(COLA[1] * (1 - p) + COLB[1] * p);
        const b = Math.round(COLA[2] * (1 - p) + COLB[2] * p);
        ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
        ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
      }
    }
    for (const pt of dataRef.current) {
      const px = ((pt.x + 1) / 2) * SIZE;
      const py = (1 - (pt.y + 1) / 2) * SIZE;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      const c = pt.label ? COLB : COLA;
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#0b1020";
      ctx.stroke();
    }
  }, []);

  const resetWith = useCallback(
    (k: DatasetKind) => {
      netRef.current = new MLP(16);
      dataRef.current = makeDataset(k, 200);
      setEpoch(0);
      setLoss(0);
      setAcc(0);
      setHist([]);
      requestAnimationFrame(() => draw());
    },
    [draw]
  );

  useEffect(() => {
    resetWith("moons");
  }, [resetWith]);

  const runEpochs = useCallback(
    (n: number) => {
      const net = netRef.current;
      if (!net) return;
      let l = 0;
      for (let i = 0; i < n; i++) l = net.trainEpoch(dataRef.current, 0.5, 0.9);
      setEpoch((e) => e + n);
      setLoss(l);
      setAcc(net.accuracy(dataRef.current));
      setHist((h) => [...h.slice(-99), l]);
      draw();
    },
    [draw]
  );

  useEffect(() => {
    if (!playing) return;
    let stop = false;
    const tick = () => {
      if (stop) return;
      runEpochs(2);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing, runEpochs]);

  const onDataset = (k: DatasetKind) => {
    setPlaying(false);
    setKind(k);
    resetWith(k);
  };
  const onReset = () => {
    setPlaying(false);
    resetWith(kind);
  };

  const narration =
    epoch === 0 ? t.nStart[lang] : acc >= 0.99 ? t.nDone[lang] : acc >= 0.9 ? t.nAlmost[lang] : t.nLearn[lang];

  const spark = (() => {
    if (hist.length < 2) return "";
    const max = Math.max(...hist, 0.7);
    const w = 200;
    const h = 40;
    return hist.map((v, i) => `${(i / (hist.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  })();

  return (
    <section id="train">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="grid2" style={{ marginTop: 18, alignItems: "start" }}>
          <div className="card">
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              style={{ width: "100%", maxWidth: SIZE, borderRadius: 10, border: "1px solid var(--line)", display: "block", margin: "0 auto" }}
            />
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 10, fontSize: ".82rem" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: `rgb(${COLA.join(",")})`, marginRight: 5 }} />{t.g1[lang]}</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: `rgb(${COLB.join(",")})`, marginRight: 5 }} />{t.g2[lang]}</span>
            </div>
          </div>

          <div className="card">
            <div className="btnrow" style={{ marginTop: 0 }}>
              <button className="lang-btn" onClick={() => setPlaying((p) => !p)}>{playing ? t.pause[lang] : t.play[lang]}</button>
              <button className="preset" onClick={() => { setPlaying(false); runEpochs(20); }}>{t.step[lang]}</button>
              <button className="preset" onClick={onReset}>{t.reset[lang]}</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <span className="count-unit">{t.dataset[lang]}:</span>
              <div className="btnrow">
                {([["moons", t.dsMoons], ["spiral", t.dsSpiral], ["xor", t.dsXor], ["circle", t.dsCircle], ["blobs", t.dsBlobs]] as const).map(([k, lbl]) => (
                  <button key={k} className="preset" onClick={() => onDataset(k)} style={kind === k ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}>
                    {lbl[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid3" style={{ marginTop: 14 }}>
              <div><div className="count-unit">{t.epoch[lang]}</div><div className="count-big" style={{ fontSize: "1.5rem" }}>{epoch}</div></div>
              <div><div className="count-unit">{t.loss[lang]}</div><div className="count-big" style={{ fontSize: "1.5rem", color: "#ffb454" }}>{loss.toFixed(3)}</div></div>
              <div><div className="count-unit">{t.acc[lang]}</div><div className="count-big" style={{ fontSize: "1.5rem", color: "#5fe08a" }}>{(acc * 100).toFixed(0)}%</div></div>
            </div>
            <svg viewBox="0 0 200 40" style={{ width: "100%", height: 42, marginTop: 10 }} preserveAspectRatio="none">
              <polyline points={spark} fill="none" stroke="#ffb454" strokeWidth={1.5} />
            </svg>
            <div className="callout" style={{ marginTop: 6 }}>{narration}</div>
          </div>
        </div>
        <div className="callout" style={{ borderLeftColor: "var(--warn)" }}>{t.xorHint[lang]}</div>
      </div>
    </section>
  );
}
