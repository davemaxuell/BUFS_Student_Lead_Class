"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadEmbedder, embed } from "@/lib/embedder";
import { pca3, cosine } from "@/lib/pca";

type Status = "idle" | "loading" | "ready" | "error";
const DEFAULT_WORDS = [
  "king", "queen", "man", "woman", "dog", "cat", "apple", "banana",
  "Seoul", "Korea", "Tokyo", "Japan", "Paris", "France", "happy", "sad",
];

// country ↔ its capital — the relationship we want to show is consistent
const REL_PAIRS: [string, string][] = [
  ["Korea", "Seoul"],
  ["Japan", "Tokyo"],
  ["France", "Paris"],
];

export default function Embed3D() {
  const { lang } = useLang();
  const t = S.emb3d;
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [vecs, setVecs] = useState<number[][]>([]);
  const [coords, setCoords] = useState<number[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ana, setAna] = useState({ a: 0, b: 1, c: 2, d: 3 }); // analogy A−B vs C−D
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(0.3);
  const [zoom, setZoom] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeRef = useRef<any>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const load = () => {
    setStatus("loading");
    setProgress(0);
    loadEmbedder((pct) => setProgress(pct))
      .then(async (pipe) => {
        pipeRef.current = pipe;
        const vs: number[][] = [];
        for (const w of DEFAULT_WORDS) vs.push(await embed(pipe, w));
        setWords(DEFAULT_WORDS);
        setVecs(vs);
        setCoords(pca3(vs));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  // Load the model automatically as soon as the page starts.
  useEffect(() => {
    load();
  }, []);

  // default the analogy to Seoul−Korea vs Tokyo−Japan once the words exist
  useEffect(() => {
    if (status !== "ready") return;
    const ix = (w: string, fb: number) => {
      const i = DEFAULT_WORDS.indexOf(w);
      return i < 0 ? fb : i;
    };
    setAna({ a: ix("Seoul", 0), b: ix("Korea", 1), c: ix("Tokyo", 2), d: ix("Japan", 3) });
  }, [status]);

  const addWord = async () => {
    const w = input.trim();
    if (!w || busy || words.includes(w)) return;
    setBusy(true);
    try {
      const v = await embed(pipeRef.current, w);
      const nv = [...vecs, v];
      const nw = [...words, w];
      setWords(nw);
      setVecs(nv);
      setCoords(pca3(nv));
      setInput("");
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const neighbors = useMemo(() => {
    if (sel === null || !vecs[sel]) return [];
    return words
      .map((w, i) => ({ i, w, s: cosine(vecs[sel], vecs[i]) }))
      .filter((o) => o.i !== sel)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
  }, [sel, vecs, words]);

  // Relationship of the SELECTED token to every other token (real similarity).
  const selSims = useMemo(() => {
    if (sel === null || !vecs[sel]) return [];
    return words
      .map((w, i) => ({ i, w, s: cosine(vecs[sel], vecs[i]) }))
      .filter((o) => o.i !== sel)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);
  }, [sel, vecs, words]);

  // Analogy: X1 = A − B, X2 = C − D, measured in the FULL embedding space.
  // If A:B and C:D share a relationship, X1 and X2 point the same way (cosine ≈ 1).
  const analogy = useMemo(() => {
    const { a, b, c, d } = ana;
    if (!vecs[a] || !vecs[b] || !vecs[c] || !vecs[d]) return null;
    const sub = (p: number[], q: number[]) => p.map((x, i) => x - q[i]);
    const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    const x1 = sub(vecs[a], vecs[b]);
    const x2 = sub(vecs[c], vecs[d]);
    return { cos: cosine(x1, x2), m1: norm(x1), m2: norm(x2) };
  }, [ana, vecs]);

  // shared 3-D → 2-D projection (used for both the points and the X/Y/Z axes)
  const view = useMemo(() => {
    let maxAbs = 0;
    for (const c of coords) for (const x of c) maxAbs = Math.max(maxAbs, Math.abs(x));
    const s = maxAbs || 1;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const project = (nx: number, ny: number, nz: number) => {
      const x1 = nx * cy + nz * sy;
      const z1 = -nx * sy + nz * cy;
      const y2 = ny * cp - z1 * sp;
      const z2 = ny * sp + z1 * cp;
      return { sx: 240 + x1 * 150 * zoom, sy: 210 - y2 * 150 * zoom, depth: z2 };
    };
    const projected = coords.map((c, i) => ({ i, ...project(c[0] / s, c[1] / s, c[2] / s) }));
    const L = 1.2;
    const axes = [
      { k: "X", color: "#ff7a90", pos: project(L, 0, 0), neg: project(-L, 0, 0) },
      { k: "Y", color: "#5fe08a", pos: project(0, L, 0), neg: project(0, -L, 0) },
      { k: "Z", color: "#67c7ff", pos: project(0, 0, L), neg: project(0, 0, -L) },
    ];
    return { projected, axes, origin: project(0, 0, 0) };
  }, [coords, yaw, pitch, zoom]);

  const projected = view.projected;
  const order = [...projected].sort((a, b) => a.depth - b.depth);
  const nbSet = new Set(neighbors.map((n) => n.i));

  // Real similarity of each country↔capital pair, measured in the FULL space.
  const rels = useMemo(() => {
    return REL_PAIRS.map(([a, b]) => {
      const ia = words.indexOf(a);
      const ib = words.indexOf(b);
      if (ia < 0 || ib < 0 || !vecs[ia] || !vecs[ib]) return null;
      return { a, b, ia, ib, sim: cosine(vecs[ia], vecs[ib]) };
    }).filter(Boolean) as { a: string; b: string; ia: number; ib: number; sim: number }[];
  }, [words, vecs]);

  const projAt = (i: number) => projected.find((p) => p.i === i);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setYaw(drag.current.yaw + dx * 0.01);
    setPitch(Math.max(-1.3, Math.min(1.3, drag.current.pitch + dy * 0.01)));
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <section id="embed3d" style={{ borderTop: "none", paddingTop: 0 }}>
      <div className="container">
        <h3 style={{ fontSize: "1.2rem", marginTop: 8 }}>{t.title[lang]}</h3>
        <p className="lead">{t.intro[lang]}</p>

        {status === "loading" && (
          <div style={{ marginTop: 12, maxWidth: 360 }}>
            <p className="lead" style={{ marginBottom: 6 }}>{t.loading[lang]} {progress > 0 && progress < 100 ? `(${progress}%)` : ""}</p>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(progress, 3)}%`, transition: "width .2s" }} />
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="callout" style={{ borderLeftColor: "var(--danger)" }}>
            {t.error[lang]} <button className="preset" onClick={load}>{t.retry[lang]}</button>
          </div>
        )}

        {status === "ready" && (
          <>
            <div className="card" style={{ marginTop: 14 }}>
              <div className="btnrow" style={{ marginTop: 0, marginBottom: 8 }}>
                <input
                  type="text"
                  value={input}
                  placeholder={t.addPlaceholder[lang]}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWord()}
                  style={{ flex: 1, minWidth: 160 }}
                />
                <button className="lang-btn" onClick={addWord} disabled={busy}>{busy ? t.busy[lang] : t.addBtn[lang]}</button>
                <button className="preset" onClick={() => setZoom((z) => Math.min(3, z * 1.2))}>+</button>
                <button className="preset" onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}>−</button>
                <button className="preset" onClick={() => { setYaw(0.6); setPitch(0.3); setZoom(1); }}>{t.resetView[lang]}</button>
              </div>

              <svg
                viewBox="0 0 480 420"
                style={{ width: "100%", height: "auto", touchAction: "none", cursor: "grab", borderRadius: 10, border: "1px solid var(--line)", background: "#0d1430" }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
              >
                {/* X / Y / Z axes (rotate with the view) */}
                {view.axes.map((ax) => (
                  <g key={ax.k}>
                    <line x1={ax.neg.sx} y1={ax.neg.sy} x2={ax.pos.sx} y2={ax.pos.sy} stroke={ax.color} strokeWidth={1} opacity={0.45} />
                    <circle cx={ax.pos.sx} cy={ax.pos.sy} r={2.4} fill={ax.color} opacity={0.8} />
                    <text x={ax.pos.sx + 4} y={ax.pos.sy + 4} fontSize={12} fontWeight={800} fill={ax.color} opacity={0.85}>{ax.k}</text>
                  </g>
                ))}
                {/* country ↔ capital relationship links (gold) */}
                {rels.map((r) => {
                  const a = projAt(r.ia);
                  const b = projAt(r.ib);
                  if (!a || !b) return null;
                  return (
                    <g key={r.a}>
                      <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#ffd479" strokeWidth={2} opacity={0.9} />
                      <text x={(a.sx + b.sx) / 2} y={(a.sy + b.sy) / 2 - 3} fontSize={10} fontWeight={700} fill="#ffd479" textAnchor="middle">
                        {(r.sim * 100).toFixed(0)}%
                      </text>
                    </g>
                  );
                })}
                {/* analogy offset arrows: B→A (X1) and D→C (X2) */}
                <defs>
                  <marker id="anaArr1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#9b8cff" /></marker>
                  <marker id="anaArr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#ff9d5c" /></marker>
                </defs>
                {analogy && (() => {
                  const A = projAt(ana.a), B = projAt(ana.b), C = projAt(ana.c), D = projAt(ana.d);
                  return (
                    <>
                      {B && A && <line x1={B.sx} y1={B.sy} x2={A.sx} y2={A.sy} stroke="#9b8cff" strokeWidth={2.4} markerEnd="url(#anaArr1)" />}
                      {D && C && <line x1={D.sx} y1={D.sy} x2={C.sx} y2={C.sy} stroke="#ff9d5c" strokeWidth={2.4} markerEnd="url(#anaArr2)" />}
                    </>
                  );
                })()}
                {/* neighbor links */}
                {sel !== null &&
                  neighbors.map((n) => {
                    const a = projected.find((p) => p.i === sel)!;
                    const b = projected.find((p) => p.i === n.i)!;
                    return <line key={n.i} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke="#58e0c8" strokeWidth={1} strokeDasharray="3 3" />;
                  })}
                {order.map((p) => {
                  const dn = (p.depth + 1.4) / 2.8; // ~0..1 depth factor
                  const r = 3 + dn * 5;
                  const active = sel === p.i;
                  const nb = nbSet.has(p.i);
                  const fill = active ? "#7c9cff" : nb ? "#58e0c8" : "#9aa6d6";
                  const op = sel === null || active || nb ? 0.55 + dn * 0.45 : 0.25;
                  return (
                    <g key={p.i} onClick={() => setSel(active ? null : p.i)} style={{ cursor: "pointer" }}>
                      <circle cx={p.sx} cy={p.sy} r={r} fill={fill} opacity={op} />
                      <text x={p.sx + r + 2} y={p.sy + 3} fontSize={11} fill={active || nb ? "#e9edff" : "#9aa6d6"} opacity={op}>
                        {words[p.i]}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="note">{t.dragHint[lang]}</div>
            </div>

            {sel === null
              ? rels.length > 1 && (
                  <div className="card" style={{ marginTop: 14 }}>
                    <div className="label" style={{ color: "#ffd479" }}>{t.relTitle[lang]}</div>
                    {rels.map((r) => (
                      <div className="bar-row" key={r.a} style={{ gridTemplateColumns: "150px 1fr 56px" }}>
                        <div className="bar-label">{r.a} ↔ {r.b}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.max(r.sim * 100, 3)}%`, background: "#ffd479" }} />
                        </div>
                        <div className="bar-meta">{(r.sim * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                    <div className="note">{t.relNote[lang]}</div>
                  </div>
                )
              : (
                  <div className="card" style={{ marginTop: 14 }}>
                    <div className="label">{t.relSelTitle[lang].replace("{w}", words[sel])}</div>
                    {selSims.map((o) => (
                      <div className="bar-row" key={o.i} style={{ gridTemplateColumns: "150px 1fr 56px" }}>
                        <div className="bar-label" style={{ cursor: "pointer" }} onClick={() => setSel(o.i)}>{words[sel]} ↔ {o.w}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.max(o.s * 100, 3)}%` }} />
                        </div>
                        <div className="bar-meta">{(o.s * 100).toFixed(0)}%</div>
                      </div>
                    ))}
                    <div className="note">{t.relSelNote[lang]}</div>
                  </div>
                )}

            {/* analogy: A − B  vs  C − D */}
            {analogy && (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="label">{t.anaTitle[lang]}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontFamily: "ui-monospace, monospace" }}>
                  <b style={{ color: "#9b8cff" }}>X₁ =</b>
                  {(["a", "b"] as const).map((key, idx) => (
                    <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {idx === 1 && <span>−</span>}
                      <select value={ana[key]} onChange={(e) => setAna({ ...ana, [key]: +e.target.value })} style={{ minWidth: 86 }}>
                        {words.map((w, i) => <option key={i} value={i}>{w}</option>)}
                      </select>
                    </span>
                  ))}
                  <b style={{ color: "#ff9d5c", marginLeft: 10 }}>X₂ =</b>
                  {(["c", "d"] as const).map((key, idx) => (
                    <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {idx === 1 && <span>−</span>}
                      <select value={ana[key]} onChange={(e) => setAna({ ...ana, [key]: +e.target.value })} style={{ minWidth: 86 }}>
                        {words.map((w, i) => <option key={i} value={i}>{w}</option>)}
                      </select>
                    </span>
                  ))}
                </div>
                <div className="bar-row" style={{ gridTemplateColumns: "150px 1fr 56px", marginTop: 12 }}>
                  <div className="bar-label">{t.dirMatch[lang]}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(analogy.cos * 100, 3)}%`, background: analogy.cos > 0.45 ? "#5fe08a" : "#ffb454" }} /></div>
                  <div className="bar-meta">{(analogy.cos * 100).toFixed(0)}%</div>
                </div>
                <div className="note" style={{ fontFamily: "ui-monospace, monospace" }}>|X₁| = {analogy.m1.toFixed(2)} · |X₂| = {analogy.m2.toFixed(2)}</div>
                <div className="callout" style={{ borderLeftColor: analogy.cos > 0.45 ? "#5fe08a" : "#ffb454", marginTop: 8 }}>
                  {(analogy.cos > 0.45 ? t.anaHigh[lang] : analogy.cos > 0.2 ? t.anaMid[lang] : t.anaLow[lang])
                    .replace("{a}", words[ana.a]).replace("{b}", words[ana.b]).replace("{c}", words[ana.c]).replace("{d}", words[ana.d])}
                </div>
                <div className="note">{t.anaNote[lang]}</div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
