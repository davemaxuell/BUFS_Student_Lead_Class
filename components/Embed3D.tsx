"use client";

import { useMemo, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { loadEmbedder, embed } from "@/lib/embedder";
import { pca3, cosine } from "@/lib/pca";

type Status = "idle" | "loading" | "ready" | "error";
const DEFAULT_WORDS = [
  "king", "queen", "man", "woman", "dog", "cat", "apple", "banana",
  "Seoul", "Korea", "Tokyo", "Japan", "one", "two", "happy", "sad",
];

export default function Embed3D() {
  const { lang } = useLang();
  const t = S.emb3d;
  const [status, setStatus] = useState<Status>("idle");
  const [words, setWords] = useState<string[]>([]);
  const [vecs, setVecs] = useState<number[][]>([]);
  const [coords, setCoords] = useState<number[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(0.3);
  const [zoom, setZoom] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeRef = useRef<any>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  const load = () => {
    setStatus("loading");
    loadEmbedder()
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

  const projected = useMemo(() => {
    if (!coords.length) return [] as { i: number; sx: number; sy: number; depth: number }[];
    let maxAbs = 0;
    for (const c of coords) for (const x of c) maxAbs = Math.max(maxAbs, Math.abs(x));
    const s = maxAbs || 1;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    return coords.map((c, i) => {
      const x = c[0] / s;
      const y = c[1] / s;
      const z = c[2] / s;
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      return { i, sx: 240 + x1 * 150 * zoom, sy: 210 - y2 * 150 * zoom, depth: z2 };
    });
  }, [coords, yaw, pitch, zoom]);

  const order = [...projected].sort((a, b) => a.depth - b.depth);
  const nbSet = new Set(neighbors.map((n) => n.i));

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
        <h3 style={{ fontSize: "1.2rem", marginTop: 8 }}>🧭 {t.title[lang]}</h3>
        <p className="lead">{t.intro[lang]}</p>

        {status === "idle" && (
          <button className="lang-btn" style={{ marginTop: 12 }} onClick={load}>{t.loadBtn[lang]}</button>
        )}
        {status === "loading" && <p className="lead" style={{ marginTop: 12 }}>⏳ {t.loading[lang]}</p>}
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
              </div>

              <svg
                viewBox="0 0 480 420"
                style={{ width: "100%", height: "auto", touchAction: "none", cursor: "grab", borderRadius: 10, border: "1px solid var(--line)", background: "#0d1430" }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
              >
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

            {sel !== null && (
              <div className="callout">
                <b>{words[sel]}</b> — {t.neighbors[lang]}:{" "}
                {neighbors.map((n) => `${n.w} (${(n.s * 100).toFixed(0)}%)`).join(", ")}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
