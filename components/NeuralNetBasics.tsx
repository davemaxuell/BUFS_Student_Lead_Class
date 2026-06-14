"use client";

import { useEffect, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem" }}>
        <span className="count-unit">{label}</span>
        <b style={{ fontFamily: "ui-monospace, monospace" }}>{value.toFixed(2)}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

export default function NeuralNetBasics() {
  const { lang } = useLang();
  const t = S.nnb;
  const [x1, setX1] = useState(0.8);
  const [x2, setX2] = useState(0.3);
  const [w1, setW1] = useState(1.2);
  const [w2, setW2] = useState(-0.8);
  const [b, setB] = useState(0.2);

  const sum = w1 * x1 + w2 * x2 + b;
  const out = sigmoid(sum);

  // Sweep animation: drives the operating point across the inline sigmoid.
  const [sweeping, setSweeping] = useState(false);
  const [sweepZ, setSweepZ] = useState(-8);
  const raf = useRef<number>(0);
  const dir = useRef(1);
  useEffect(() => {
    if (!sweeping) return;
    let stop = false;
    const tick = () => {
      if (stop) return;
      setSweepZ((z) => {
        let nz = z + dir.current * 0.1;
        if (nz > 8) { nz = 8; dir.current = -1; }
        if (nz < -8) { nz = -8; dir.current = 1; }
        return nz;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { stop = true; cancelAnimationFrame(raf.current); };
  }, [sweeping]);

  const wColor = (w: number) => (w >= 0 ? "#7c9cff" : "#ff7a90");
  const wWidth = (w: number) => 1 + Math.min(Math.abs(w), 2) * 3;

  // --- inline sigmoid (the activation σ stage of the neuron) ---
  const bx = 240, by = 70, bw = 104, bh = 90, ipad = 8;
  const zToX = (z: number) => bx + ipad + ((z + 8) / 16) * (bw - 2 * ipad);
  const sToY = (s: number) => by + bh - ipad - s * (bh - 2 * ipad);
  let curve = "";
  for (let i = 0; i <= 48; i++) {
    const z = -8 + (16 * i) / 48;
    curve += `${zToX(z).toFixed(1)},${sToY(sigmoid(z)).toFixed(1)} `;
  }
  const ptZ = sweeping ? sweepZ : clamp(sum, -8, 8);
  const ptS = sigmoid(ptZ);

  // weight-label position helper: place a small chip at an edge midpoint.
  const WLabel = ({ x, y, w, name }: { x: number; y: number; w: number; name: string }) => (
    <g>
      <rect x={x - 26} y={y - 9} width={52} height={18} rx={5} fill="#0f1530" stroke={wColor(w)} strokeWidth={1} opacity={0.95} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="10.5" fontFamily="ui-monospace, monospace" fill="#e9edff">
        {name}={w.toFixed(2)}
      </text>
    </g>
  );

  return (
    <section id="nnb">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h1>{t.title[lang]}</h1>
        <p className="lead">{t.intro[lang]}</p>

        <div className="grid2" style={{ marginTop: 20 }}>
          <div className="card">
            <h3>{t.neuronTitle[lang]}</h3>
            <p className="desc" style={{ marginBottom: 12 }}>{t.neuronHelp[lang]}</p>
            <Slider label={`${t.input[lang]} 1 (x₁)`} value={x1} min={-1} max={1} step={0.05} onChange={setX1} />
            <Slider label={`${t.input[lang]} 2 (x₂)`} value={x2} min={-1} max={1} step={0.05} onChange={setX2} />
            <Slider label={`${t.weight[lang]} 1 (w₁)`} value={w1} min={-2} max={2} step={0.05} onChange={setW1} />
            <Slider label={`${t.weight[lang]} 2 (w₂)`} value={w2} min={-2} max={2} step={0.05} onChange={setW2} />
            <Slider label={`${t.bias[lang]} (b)`} value={b} min={-2} max={2} step={0.05} onChange={setB} />
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{t.sigTitle[lang]}</h3>
              <button className="preset" onClick={() => setSweeping((s) => !s)}>{sweeping ? t.sweepStop[lang] : t.sweep[lang]}</button>
            </div>
            <svg viewBox="0 0 430 220" style={{ width: "100%", height: "auto", marginTop: 6 }}>
              {/* edges (thickness + color encode weight magnitude/sign) */}
              <line x1={58} y1={70} x2={170} y2={115} stroke={wColor(w1)} strokeWidth={wWidth(w1)} />
              <line x1={58} y1={160} x2={170} y2={115} stroke={wColor(w2)} strokeWidth={wWidth(w2)} />
              {/* weight labels sit on the edges where the weights live */}
              <WLabel x={108} y={84} w={w1} name="w₁" />
              <WLabel x={108} y={146} w={w2} name="w₂" />
              {/* Σ → σ-box link, σ-box → output link */}
              <line x1={196} y1={115} x2={bx} y2={115} stroke="#58e0c8" strokeWidth={2} />
              <line x1={bx + bw} y1={115} x2={392} y2={115} stroke="#58e0c8" strokeWidth={2 + out * 4} />

              {/* input nodes */}
              <circle cx={40} cy={70} r={20} fill="#1d2750" stroke="#7c9cff" />
              <text x={40} y={75} textAnchor="middle" fill="#e9edff" fontSize="13" fontFamily="monospace">{x1.toFixed(1)}</text>
              <circle cx={40} cy={160} r={20} fill="#1d2750" stroke="#7c9cff" />
              <text x={40} y={165} textAnchor="middle" fill="#e9edff" fontSize="13" fontFamily="monospace">{x2.toFixed(1)}</text>
              <text x={40} y={30} textAnchor="middle" fill="#9aa6d6" fontSize="10">{t.input[lang]}</text>

              {/* neuron: the Σ (weighted sum + bias) stage */}
              <circle cx={183} cy={115} r={26} fill="#161e3d" stroke="#58e0c8" strokeWidth={2} />
              <text x={183} y={111} textAnchor="middle" fill="#9aa6d6" fontSize="9">Σ</text>
              <text x={183} y={124} textAnchor="middle" fill="#e9edff" fontSize="12" fontFamily="monospace">{sum.toFixed(2)}</text>
              {/* bias enters the Σ node */}
              <WLabel x={183} y={70} w={b} name="b" />
              <line x1={183} y1={79} x2={183} y2={89} stroke={wColor(b)} strokeWidth={1.5} />

              {/* inline sigmoid = the activation σ stage, right at the neuron */}
              <rect x={bx} y={by} width={bw} height={bh} rx={8} fill="#0c1228" stroke="#2a386e" />
              <text x={bx + bw / 2} y={by - 4} textAnchor="middle" fill="#9aa6d6" fontSize="10">σ</text>
              {/* baseline + 0.5 guide */}
              <line x1={zToX(-8)} y1={sToY(0)} x2={zToX(8)} y2={sToY(0)} stroke="#2a386e" strokeWidth={1} />
              <line x1={zToX(0)} y1={by + ipad} x2={zToX(0)} y2={by + bh - ipad} stroke="#2a386e" strokeWidth={1} strokeDasharray="2 3" />
              <line x1={zToX(-8)} y1={sToY(0.5)} x2={zToX(8)} y2={sToY(0.5)} stroke="#2a386e" strokeWidth={1} strokeDasharray="2 3" />
              <polyline points={curve} fill="none" stroke="#7c9cff" strokeWidth={1.8} />
              {/* operating point */}
              <line x1={zToX(ptZ)} y1={sToY(ptS)} x2={zToX(ptZ)} y2={sToY(0)} stroke="#58e0c8" strokeWidth={1} strokeDasharray="2 2" />
              <circle cx={zToX(ptZ)} cy={sToY(ptS)} r={4.5} fill="#58e0c8" />
              <text x={bx + bw / 2} y={by + bh + 12} textAnchor="middle" fill="#e9edff" fontSize="10" fontFamily="monospace">σ({ptZ.toFixed(1)}) = {ptS.toFixed(2)}</text>

              {/* output node */}
              <circle cx={410} cy={115} r={18} fill="#1d2750" stroke="#58e0c8" />
              <text x={410} y={120} textAnchor="middle" fill="#e9edff" fontSize="12" fontFamily="monospace">{out.toFixed(2)}</text>
              <text x={410} y={85} textAnchor="middle" fill="#9aa6d6" fontSize="10">{t.output[lang]}</text>
            </svg>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: ".82rem", color: "var(--text2)", margin: "6px 0 2px" }}>
              <span><span style={{ display: "inline-block", width: 16, height: 0, borderTop: "3px solid #7c9cff", verticalAlign: "middle", marginRight: 5 }} />/<span style={{ display: "inline-block", width: 16, height: 0, borderTop: "3px solid #ff7a90", verticalAlign: "middle", margin: "0 5px" }} />{t.edgeLegend[lang]}</span>
            </div>

            <div className="callout" style={{ marginTop: "auto", fontFamily: "ui-monospace, monospace", fontSize: ".9rem" }}>
              {t.sum[lang]} = ({w1.toFixed(2)})·({x1.toFixed(2)}) + ({w2.toFixed(2)})·({x2.toFixed(2)}) + ({b.toFixed(2)}) = <b>{sum.toFixed(2)}</b>
              <br />
              {t.output[lang]} = σ({sum.toFixed(2)}) = <b style={{ color: "#58e0c8" }}>{out.toFixed(3)}</b>
            </div>
          </div>
        </div>

        <div className="callout">{t.takeaway[lang]}</div>
      </div>
    </section>
  );
}
