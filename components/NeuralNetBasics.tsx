"use client";

import { useState } from "react";
import { S, useLang } from "@/lib/i18n";

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

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

  const wColor = (w: number) => (w >= 0 ? "#7c9cff" : "#ff7a90");
  const wWidth = (w: number) => 1 + Math.min(Math.abs(w), 2) * 3;

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
            <svg viewBox="0 0 320 210" style={{ width: "100%", height: "auto" }}>
              {/* edges */}
              <line x1={48} y1={60} x2={170} y2={105} stroke={wColor(w1)} strokeWidth={wWidth(w1)} />
              <line x1={48} y1={150} x2={170} y2={105} stroke={wColor(w2)} strokeWidth={wWidth(w2)} />
              <line x1={196} y1={105} x2={278} y2={105} stroke="#58e0c8" strokeWidth={2 + out * 4} />
              {/* input nodes */}
              <circle cx={40} cy={60} r={20} fill="#1d2750" stroke="#7c9cff" />
              <text x={40} y={65} textAnchor="middle" fill="#e9edff" fontSize="13" fontFamily="monospace">{x1.toFixed(1)}</text>
              <circle cx={40} cy={150} r={20} fill="#1d2750" stroke="#7c9cff" />
              <text x={40} y={155} textAnchor="middle" fill="#e9edff" fontSize="13" fontFamily="monospace">{x2.toFixed(1)}</text>
              {/* neuron */}
              <circle cx={183} cy={105} r={26} fill="#161e3d" stroke="#58e0c8" strokeWidth={2} />
              <text x={183} y={102} textAnchor="middle" fill="#9aa6d6" fontSize="9">Σ → σ</text>
              <text x={183} y={116} textAnchor="middle" fill="#e9edff" fontSize="13" fontFamily="monospace">{out.toFixed(2)}</text>
              {/* output */}
              <circle cx={296} cy={105} r={18} fill="#1d2750" stroke="#58e0c8" />
              <text x={296} y={110} textAnchor="middle" fill="#e9edff" fontSize="12" fontFamily="monospace">{out.toFixed(2)}</text>
              <text x={40} y={26} textAnchor="middle" fill="#9aa6d6" fontSize="10">{t.input[lang]}</text>
              <text x={296} y={75} textAnchor="middle" fill="#9aa6d6" fontSize="10">{t.output[lang]}</text>
            </svg>

            <div className="callout" style={{ marginTop: "auto", fontFamily: "ui-monospace, monospace", fontSize: ".82rem" }}>
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
