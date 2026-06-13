"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";

const sig = (z: number) => 1 / (1 + Math.exp(-z));
const LR = 1.5;
const EX = { x: [1, 0], t: 1 }; // one fixed example: watch its loss fall each step

type Params = { W1: number[][]; b1: number[]; W2: number[]; b2: number };

const INIT: Params = { W1: [[0.6, -0.5], [-0.4, 0.7]], b1: [0.1, -0.2], W2: [0.5, -0.6], b2: 0.15 };

function freshParams(rand: boolean): Params {
  if (!rand) return JSON.parse(JSON.stringify(INIT));
  const r = () => +(Math.random() * 1.6 - 0.8).toFixed(2);
  return { W1: [[r(), r()], [r(), r()]], b1: [r(), r()], W2: [r(), r()], b2: r() };
}

function computeAll(p: Params) {
  const [x0, x1] = EX.x;
  const t = EX.t;
  const z1 = [p.W1[0][0] * x0 + p.W1[0][1] * x1 + p.b1[0], p.W1[1][0] * x0 + p.W1[1][1] * x1 + p.b1[1]];
  const a1 = [sig(z1[0]), sig(z1[1])];
  const z2 = p.W2[0] * a1[0] + p.W2[1] * a1[1] + p.b2;
  const yhat = sig(z2);
  const loss = 0.5 * (yhat - t) ** 2;
  const dz2 = (yhat - t) * yhat * (1 - yhat);
  const gW2 = [dz2 * a1[0], dz2 * a1[1]];
  const gb2 = dz2;
  const dz1 = [dz2 * p.W2[0] * a1[0] * (1 - a1[0]), dz2 * p.W2[1] * a1[1] * (1 - a1[1])];
  const gW1 = [[dz1[0] * x0, dz1[0] * x1], [dz1[1] * x0, dz1[1] * x1]];
  const gb1 = [dz1[0], dz1[1]];
  return { z1, a1, z2, yhat, loss, gW1, gb1, gW2, gb2 };
}

function applyUpdate(p: Params, g: ReturnType<typeof computeAll>): Params {
  return {
    W1: [
      [p.W1[0][0] - LR * g.gW1[0][0], p.W1[0][1] - LR * g.gW1[0][1]],
      [p.W1[1][0] - LR * g.gW1[1][0], p.W1[1][1] - LR * g.gW1[1][1]],
    ],
    b1: [p.b1[0] - LR * g.gb1[0], p.b1[1] - LR * g.gb1[1]],
    W2: [p.W2[0] - LR * g.gW2[0], p.W2[1] - LR * g.gW2[1]],
    b2: p.b2 - LR * g.gb2,
  };
}

export default function BackpropSequence() {
  const { lang } = useLang();
  const t = S.bp;
  const [params, setParams] = useState<Params>(() => freshParams(false));
  // phases: 0 setup · 1 forward→h₀ · 2 forward→h₁ · 3 forward→ŷ · 4 loss · 5 backprop · 6 update
  const [phase, setPhase] = useState(0);
  const [iter, setIter] = useState(0);
  const [playing, setPlaying] = useState(false);

  const a = useMemo(() => computeAll(params), [params]);

  const next = () => {
    if (phase < 6) {
      setPhase(phase + 1);
      return;
    }
    setParams(applyUpdate(params, a));
    setIter(iter + 1);
    setPhase(1);
  };

  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => nextRef.current(), 1500);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setPlaying(false);
    setParams(freshParams(true));
    setIter(0);
    setPhase(0);
  };

  const phaseName = [t.p0, t.p1, t.p2, t.p3, t.p4, t.p5, t.p6][phase][lang];
  const narration = [t.n0, t.n1, t.n2, t.n3, t.n4, t.n5, t.n6][phase][lang];

  const fwd = phase >= 1 && phase <= 3; // forward, one neuron at a time
  const activeNode = phase === 1 ? "h0" : phase === 2 ? "h1" : phase === 3 ? "y" : null;
  const done = (n: string) => (n === "h0" ? phase >= 1 : n === "h1" ? phase >= 2 : phase >= 3);

  const edges = [
    { x1: 38, y1: 60, x2: 168, y2: 55, w: params.W1[0][0], to: "h0" },
    { x1: 38, y1: 140, x2: 168, y2: 55, w: params.W1[0][1], to: "h0" },
    { x1: 38, y1: 60, x2: 168, y2: 145, w: params.W1[1][0], to: "h1" },
    { x1: 38, y1: 140, x2: 168, y2: 145, w: params.W1[1][1], to: "h1" },
    { x1: 172, y1: 55, x2: 302, y2: 100, w: params.W2[0], to: "y" },
    { x1: 172, y1: 145, x2: 302, y2: 100, w: params.W2[1], to: "y" },
  ];

  // per-edge styling: in forward mode only the arrows feeding the current neuron light up
  const edgeStyle = (to: string): { stroke: string; w: number } => {
    if (phase === 0) return { stroke: "var(--line)", w: 1.4 };
    if (fwd) {
      if (to === activeNode) return { stroke: "#aec2ff", w: 3 };
      return done(to) ? { stroke: "#4f66b8", w: 1.4 } : { stroke: "var(--line)", w: 1.2 };
    }
    if (phase === 5) return { stroke: "#ffb454", w: 1.9 }; // backprop
    if (phase === 6) return { stroke: "#5fe08a", w: 1.9 }; // update
    return { stroke: "#7c9cff", w: 1.6 }; // loss (4): full network computed
  };

  const node = (cx: number, cy: number, label: string, val: string, stroke: string, active = false) => (
    <g>
      {active && <circle cx={cx} cy={cy} r={25} fill="#aec2ff" opacity={0.16} />}
      <circle cx={cx} cy={cy} r={20} fill="#161e3d" stroke={active ? "#aec2ff" : stroke} strokeWidth={active ? 2.6 : 1.5} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="14" fontWeight={700} fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" style={{ fontVariantNumeric: "tabular-nums" }}>{val}</text>
      <text x={cx} y={cy + 33} textAnchor="middle" fill="#aeb8e0" fontSize="11" fontWeight={600}>{label}</text>
    </g>
  );

  const f2 = (n: number) => n.toFixed(2);
  let calcLine = "";
  if (phase === 1) calcLine = `h₀ = σ( ${f2(params.W1[0][0])}×${EX.x[0]} + ${f2(params.W1[0][1])}×${EX.x[1]} + ${f2(params.b1[0])} ) = σ(${f2(a.z1[0])}) = ${f2(a.a1[0])}`;
  else if (phase === 2) calcLine = `h₁ = σ( ${f2(params.W1[1][0])}×${EX.x[0]} + ${f2(params.W1[1][1])}×${EX.x[1]} + ${f2(params.b1[1])} ) = σ(${f2(a.z1[1])}) = ${f2(a.a1[1])}`;
  else if (phase === 3) calcLine = `ŷ = σ( ${f2(params.W2[0])}×${f2(a.a1[0])} + ${f2(params.W2[1])}×${f2(a.a1[1])} + ${f2(params.b2)} ) = σ(${f2(a.z2)}) = ${f2(a.yhat)}`;

  const rows = [
    { l: "W₁ x₀→h₀", v: params.W1[0][0], g: a.gW1[0][0] },
    { l: "W₁ x₁→h₀", v: params.W1[0][1], g: a.gW1[0][1] },
    { l: "W₁ x₀→h₁", v: params.W1[1][0], g: a.gW1[1][0] },
    { l: "W₁ x₁→h₁", v: params.W1[1][1], g: a.gW1[1][1] },
    { l: "b₁ h₀", v: params.b1[0], g: a.gb1[0] },
    { l: "b₁ h₁", v: params.b1[1], g: a.gb1[1] },
    { l: "W₂ h₀→ŷ", v: params.W2[0], g: a.gW2[0] },
    { l: "W₂ h₁→ŷ", v: params.W2[1], g: a.gW2[1] },
    { l: "b₂ ŷ", v: params.b2, g: a.gb2 },
  ];

  return (
    <section id="backprop">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div className="btnrow" style={{ marginTop: 14 }}>
          <button className="lang-btn" onClick={next}>{t.next[lang]}</button>
          <button className="preset" onClick={() => setPlaying((p) => !p)}>{playing ? t.pause[lang] : t.play[lang]}</button>
          <button className="preset" onClick={reset}>{t.reset[lang]}</button>
          <span className="count-unit" style={{ alignSelf: "center" }}>
            {t.iter[lang]} {iter} · <b style={{ color: "var(--accent2)" }}>{phaseName}</b> · {t.lr[lang]} {LR}
          </span>
        </div>

        <div className="callout">{narration}</div>

        {fwd && (
          <div className="callout" style={{ borderLeftColor: "#aec2ff" }}>
            <div className="count-unit" style={{ marginBottom: 4 }}>{t.calc[lang]}</div>
            <div style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontVariantNumeric: "tabular-nums", fontSize: ".98rem", color: "#eef2ff", fontWeight: 600, lineHeight: 1.5 }}>
              {calcLine}
            </div>
          </div>
        )}

        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="card">
            <svg viewBox="0 0 340 200" style={{ width: "100%", height: "auto" }}>
              {edges.map((e, i) => {
                const es = edgeStyle(e.to);
                const lit = (fwd && e.to === activeNode) || (!fwd && phase >= 4);
                return (
                  <g key={i}>
                    <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={es.stroke} strokeWidth={es.w} />
                    {lit && (
                      <g>
                        <rect x={(e.x1 + e.x2) / 2 - 15} y={(e.y1 + e.y2) / 2 - 12} width={30} height={14} rx={3} fill="#0b1230" opacity={0.85} />
                        <text x={(e.x1 + e.x2) / 2} y={(e.y1 + e.y2) / 2 - 1} textAnchor="middle" fill="#dfe6ff" fontSize="10.5" fontWeight={600} fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {e.w.toFixed(2)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              {node(38, 60, "x₀", String(EX.x[0]), "#7c9cff")}
              {node(38, 140, "x₁", String(EX.x[1]), "#7c9cff")}
              {node(170, 55, "h₀", phase >= 1 ? a.a1[0].toFixed(2) : "?", phase >= 1 ? "#7c9cff" : "var(--line)", phase === 1)}
              {node(170, 145, "h₁", phase >= 2 ? a.a1[1].toFixed(2) : "?", phase >= 2 ? "#7c9cff" : "var(--line)", phase === 2)}
              {node(302, 100, "ŷ", phase >= 3 ? a.yhat.toFixed(2) : "?", phase >= 3 ? "#58e0c8" : "var(--line)", phase === 3)}
            </svg>
            <div className="grid3" style={{ marginTop: 8 }}>
              <div><div className="count-unit">{t.target[lang]}</div><b>{EX.t}</b></div>
              <div><div className="count-unit">{t.pred[lang]}</div><b>{phase >= 3 ? a.yhat.toFixed(3) : "—"}</b></div>
              <div><div className="count-unit">{t.loss[lang]}</div><b style={{ color: "#ffb454" }}>{phase >= 4 ? a.loss.toFixed(4) : "—"}</b></div>
            </div>
          </div>

          <div className="card">
            <table style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: ".95rem", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr>
                  <th>{t.colWeight[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.colValue[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.colGrad[lang]}</th>
                  <th style={{ textAlign: "right" }}>{t.colNew[lang]}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const nv = r.v - LR * r.g;
                  return (
                    <tr key={r.l}>
                      <td>{r.l}</td>
                      <td style={{ textAlign: "right", color: "#e9edff", fontWeight: 600 }}>{r.v.toFixed(2)}</td>
                      <td style={{ textAlign: "right", color: phase >= 5 ? "#ffc777" : "var(--muted)", fontWeight: phase >= 5 ? 600 : 400 }}>{phase >= 5 ? r.g.toFixed(3) : "—"}</td>
                      <td style={{ textAlign: "right", color: phase === 6 ? "#74e89a" : "var(--muted)", fontWeight: phase === 6 ? 700 : 400 }}>
                        {phase === 6 ? nv.toFixed(2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
