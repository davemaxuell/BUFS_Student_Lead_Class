"use client";

import { useEffect, useRef, useState } from "react";
import { S, useLang } from "@/lib/i18n";
import { initBPE, bpeStep, applyMerges, BPEState } from "@/lib/bpe";
import { chipStyle } from "@/lib/chip";

// Real BPE stops at a chosen vocabulary budget — a fixed number of merge rules.
// Without one, a tiny corpus would merge every word into a single whole token
// (memorizing the dictionary), which defeats the purpose of SUBWORD pieces.
const MERGE_BUDGET = 10;

// Two training sets students can switch between. Each "tries" list mixes clean
// builds from learned pieces, a partial build, and an unseen Korean word that
// falls back to single characters (the token tax).
const CORPORA = [
  {
    key: "endings",
    label: { en: "Set A · endings (-er / -est)", ko: "세트 A · 어미 (-er / -est)" },
    corpus: [
      { word: "low", freq: 7 },
      { word: "lower", freq: 5 },
      { word: "lowest", freq: 3 },
      { word: "slow", freq: 4 },
      { word: "slower", freq: 3 },
      { word: "new", freq: 6 },
      { word: "newer", freq: 6 },
      { word: "newest", freq: 4 },
      { word: "wide", freq: 3 },
      { word: "wider", freq: 3 },
      { word: "widest", freq: 2 },
    ],
    tries: ["slowest", "lowest", "newest", "slower", "wider", "fastest", "highest", "학교"],
  },
  {
    key: "verbs",
    label: { en: "Set B · verbs (-ing / -ed)", ko: "세트 B · 동사 (-ing / -ed)" },
    corpus: [
      { word: "play", freq: 6 },
      { word: "playing", freq: 5 },
      { word: "played", freq: 4 },
      { word: "player", freq: 3 },
      { word: "walk", freq: 5 },
      { word: "walking", freq: 4 },
      { word: "walked", freq: 3 },
      { word: "talk", freq: 4 },
      { word: "talking", freq: 3 },
      { word: "talked", freq: 3 },
      { word: "jump", freq: 4 },
      { word: "jumping", freq: 3 },
    ],
    tries: ["walking", "talked", "player", "jumped", "running", "playest", "학교"],
  },
] as const;

export default function BPETrainer() {
  const { lang } = useLang();
  const t = S.bpetrain;
  const [cix, setCix] = useState(0);
  const active = CORPORA[cix];
  const [st, setSt] = useState<BPEState>(() => initBPE(CORPORA[0].corpus.slice()));
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [testWord, setTestWord] = useState<string>(CORPORA[0].tries[0]);
  const stRef = useRef(st);
  useEffect(() => {
    stRef.current = st;
  }, [st]);

  // Apply one merge, unless we've hit the vocabulary budget. Returns whether
  // more merges remain.
  const advance = (): boolean => {
    if (stRef.current.merges.length >= MERGE_BUDGET) return false;
    const ns = bpeStep(stRef.current);
    if (!ns) return false;
    setSt(ns);
    return ns.merges.length < MERGE_BUDGET;
  };

  const stepOnce = () => {
    if (!advance()) {
      setDone(true);
      setPlaying(false);
    }
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!advance()) {
        setDone(true);
        setPlaying(false);
      }
    }, 750);
    return () => clearInterval(id);
  }, [playing]);

  const reset = () => {
    setPlaying(false);
    setDone(false);
    setSt(initBPE(active.corpus.slice()));
  };

  const switchCorpus = (i: number) => {
    setPlaying(false);
    setDone(false);
    setCix(i);
    setSt(initBPE(CORPORA[i].corpus.slice()));
    setTestWord(CORPORA[i].tries[0]);
  };

  const last = st.merges[st.merges.length - 1];
  const narration = done
    ? t.done[lang]
    : !last
    ? t.start[lang]
    : lang === "ko"
    ? `${t.mergePre[lang]} ${st.merges.length}: “${last.a}” + “${last.b}” → “${last.token}” (${last.count}회 등장)`
    : `${t.mergePre[lang]} ${st.merges.length}: “${last.a}” + “${last.b}” → “${last.token}” (appeared ${last.count}×)`;

  const testPieces = applyMerges(testWord, st.merges);

  return (
    <section id="bpe">
      <div className="container">
        <div className="eyebrow">{t.eyebrow[lang]}</div>
        <h2>{t.title[lang]}</h2>
        <p className="lead">{t.intro[lang]}</p>

        <div style={{ marginTop: 14 }}>
          <span className="count-unit">{t.trainingSet[lang]}:</span>
          <div className="btnrow">
            {CORPORA.map((c, i) => (
              <button key={c.key} className="preset" onClick={() => switchCorpus(i)} style={cix === i ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}>
                {c.label[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="btnrow" style={{ marginTop: 12 }}>
          <button className="lang-btn" onClick={() => setPlaying((p) => !p)} disabled={done}>
            {playing ? t.pause[lang] : t.play[lang]}
          </button>
          <button className="preset" onClick={stepOnce} disabled={done}>{t.step[lang]}</button>
          <button className="preset" onClick={reset}>{t.reset[lang]}</button>
        </div>

        <div className="callout" style={{ marginTop: 12 }}>{narration}</div>

        <div className="grid2" style={{ marginTop: 14, alignItems: "start" }}>
          <div className="card">
            <div className="label">{t.corpus[lang]}</div>
            {st.words.map((w, wi) => (
              <div key={wi} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <span className="count-unit" style={{ width: 28, textAlign: "right" }}>×{w.freq}</span>
                <div className="chips" style={{ margin: 0 }}>
                  {w.symbols.map((s, si) => (
                    <span className="chip" key={si} style={chipStyle(si)}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="label">{t.merges[lang]} — {t.vocab[lang]}: {st.vocab.length}</div>
            <div className="count-unit" style={{ marginBottom: 6 }}>{t.budget[lang]}: {st.merges.length} / {MERGE_BUDGET}</div>
            <div className="chips" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              {st.merges.length === 0 && <span className="count-unit">—</span>}
              {st.merges.map((m, i) => (
                <span key={i} style={{ fontFamily: "ui-monospace, monospace", fontSize: ".85rem" }}>
                  <span className="count-unit">{i + 1}.</span> {m.a} + {m.b} → <b style={{ color: "var(--accent2)" }}>{m.token}</b>{" "}
                  <span className="count-unit">({m.count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Test on a new word */}
        <div className="card" style={{ marginTop: 14 }}>
          <label className="label">{t.tryLabel[lang]}</label>
          <div className="btnrow" style={{ marginTop: 6, marginBottom: 8 }}>
            {active.tries.map((w) => (
              <button key={w} className="preset" onClick={() => setTestWord(w)} style={testWord === w ? { borderColor: "var(--accent)", color: "var(--text)" } : {}}>
                {w}
              </button>
            ))}
          </div>
          <input type="text" value={testWord} onChange={(e) => setTestWord(e.target.value)} />
          <div className="chips" style={{ marginTop: 10 }}>
            {testPieces.map((p, i) => (
              <span className="chip" key={i} style={chipStyle(i)}>{p}</span>
            ))}
          </div>
          <div className="count-unit" style={{ marginTop: 6 }}>{testPieces.length} {t.pieces[lang]}</div>
          <div className="callout" style={{ borderLeftColor: "var(--warn)", marginTop: 10 }}>{t.tryHint[lang]}</div>
        </div>
      </div>
    </section>
  );
}
