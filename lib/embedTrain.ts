// A genuinely real, tiny embedding learner. Each token starts as a random 2-D
// vector. We learn the vectors straight from co-occurrence ("words seen together
// belong together"): pull co-occurring pairs closer, push random pairs apart —
// the core idea behind word2vec, in a form you can watch on a 2-D plane.

// Toy corpus: short "documents", each mostly about one topic. Co-occurrence
// (which words share a document) is the ONLY signal — the topics are never told
// to the model; they only color the dots so the emergent clusters are visible.
export const DOCS: string[][] = [
  ["king", "queen", "throne", "crown"],
  ["king", "prince", "crown"],
  ["queen", "royal", "crown"],
  ["prince", "royal", "throne"],
  ["king", "queen", "royal"],
  ["dog", "cat", "pet"],
  ["dog", "puppy", "pet"],
  ["cat", "kitten", "pet"],
  ["dog", "cat", "animal"],
  ["puppy", "kitten", "animal"],
  ["apple", "banana", "fruit"],
  ["apple", "grape", "sweet"],
  ["banana", "grape", "fruit"],
  ["apple", "banana", "sweet"],
  ["fruit", "sweet", "juice"],
  ["one", "two", "three"],
  ["two", "three", "four"],
  ["one", "four", "number"],
  ["three", "four", "count"],
  ["one", "two", "count"],
];

// group id per word — used ONLY for coloring the dots (not for training).
const GROUPS: Record<string, number> = {};
[
  ["king", "queen", "throne", "crown", "prince", "royal"],
  ["dog", "cat", "pet", "puppy", "kitten", "animal"],
  ["apple", "banana", "fruit", "grape", "sweet", "juice"],
  ["one", "two", "three", "four", "number", "count"],
].forEach((grp, g) => grp.forEach((w) => (GROUPS[w] = g)));

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pair = [number, number];

export class EmbModel {
  words: string[];
  group: number[];
  vec: number[][]; // V × 2 — each row IS a token's learnable embedding
  pairs: Pair[]; // co-occurring (positive) pairs from the corpus
  V: number;

  constructor() {
    const set = new Set<string>();
    for (const d of DOCS) for (const w of d) set.add(w);
    this.words = Array.from(set);
    this.V = this.words.length;
    this.group = this.words.map((w) => GROUPS[w] ?? 0);
    const idx = new Map(this.words.map((w, i) => [w, i]));
    const seen = new Set<string>();
    this.pairs = [];
    for (const d of DOCS) {
      for (let i = 0; i < d.length; i++) {
        for (let j = i + 1; j < d.length; j++) {
          const a = idx.get(d[i])!;
          const b = idx.get(d[j])!;
          const key = a < b ? `${a},${b}` : `${b},${a}`;
          if (!seen.has(key)) {
            seen.add(key);
            this.pairs.push([a, b]);
          }
        }
      }
    }
    this.vec = [];
    this.reset(1);
  }

  // Deterministic seeded init so server and client render the same first frame.
  reset(seed: number) {
    const rnd = mulberry32(seed);
    this.vec = this.words.map(() => [(rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6]);
  }

  // The model's PREDICTION that two tokens are related: high when they're close.
  // p = σ(2 − distance). This is a real probabilistic objective, not just a layout.
  relatedness(i: number, j: number): number {
    const d = Math.hypot(this.vec[i][0] - this.vec[j][0], this.vec[i][1] - this.vec[j][1]);
    return 1 / (1 + Math.exp(d - 2));
  }

  // Move i and j together (sign +1) or apart (sign −1) by an amount scaled by g.
  private nudge(i: number, j: number, g: number, sign: number) {
    const v = this.vec;
    const dx = v[j][0] - v[i][0];
    const dy = v[j][1] - v[i][1];
    v[i][0] += sign * g * dx;
    v[i][1] += sign * g * dy;
    v[j][0] -= sign * g * dx;
    v[j][1] -= sign * g * dy;
  }

  private recenter() {
    let mx = 0;
    let my = 0;
    for (const p of this.vec) {
      mx += p[0];
      my += p[1];
    }
    mx /= this.V;
    my /= this.V;
    for (const p of this.vec) {
      p[0] -= mx;
      p[1] -= my;
    }
  }

  /** One epoch. For each co-occurring pair the model predicts relatedness, and
   *  the ERROR (target − prediction) scales how far it pulls/pushes. Returns the
   *  average error (the model's "loss" — it should fall toward 0). */
  trainEpoch(lr = 0.5, negK = 4): number {
    let lossSum = 0;
    let count = 0;
    for (const [i, j] of this.pairs) {
      const p = this.relatedness(i, j); // target 1 (they co-occur)
      const err = 1 - p;
      this.nudge(i, j, lr * err, +1); // pull together, harder when more wrong
      lossSum += err;
      count++;
      for (let k = 0; k < negK; k++) {
        const n = (Math.random() * this.V) | 0;
        if (n === i || n === j) continue;
        const pn = this.relatedness(i, n); // target 0 (random)
        this.nudge(i, n, lr * pn, -1); // push apart, harder when wrongly close
        lossSum += pn;
        count++;
      }
    }
    this.recenter();
    return lossSum / Math.max(count, 1);
  }

  /** Train a SINGLE co-occurring pair against given negatives, returning the
   *  prediction details so the UI can show the predict→error→update loop. */
  trainPair(i: number, j: number, negs: number[], lr = 0.8): { pPos: number; negs: { n: number; p: number }[] } {
    const pPos = this.relatedness(i, j);
    const negInfo = negs.map((n) => ({ n, p: this.relatedness(i, n) }));
    this.nudge(i, j, lr * (1 - pPos), +1);
    for (const { n, p } of negInfo) {
      if (n === i || n === j) continue;
      this.nudge(i, n, lr * p, -1);
    }
    return { pPos, negs: negInfo };
  }

  nearest(i: number, k = 3): { j: number; d: number }[] {
    return this.vec
      .map((_, j) => ({ j, d: Math.hypot(this.vec[i][0] - this.vec[j][0], this.vec[i][1] - this.vec[j][1]) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
  }
}
