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
  coocc: Set<number>[] = []; // for each token, the set of tokens it co-occurs with
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
    // co-occurrence sets, so negative sampling never picks a true neighbor
    this.coocc = this.words.map(() => new Set<number>());
    for (const [a, b] of this.pairs) {
      this.coocc[a].add(b);
      this.coocc[b].add(a);
    }
    this.vec = [];
    this.reset(1);
  }

  /** Draw k NEGATIVE samples for token i: random tokens that do NOT co-occur
   *  with i (so we never push a genuine neighbor away). */
  sampleNegatives(i: number, k: number): number[] {
    const out: number[] = [];
    let guard = 0;
    while (out.length < k && guard++ < 100) {
      const n = (Math.random() * this.V) | 0;
      if (n === i || this.coocc[i].has(n) || out.includes(n)) continue;
      out.push(n);
    }
    return out;
  }

  // Deterministic seeded init so server and client render the same first frame.
  reset(seed: number) {
    const rnd = mulberry32(seed);
    this.vec = this.words.map(() => [(rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6]);
  }

  // The model's PREDICTION that two tokens are related: high when they're close.
  // p = σ(2 − distance). The constant 2 places the 50%-probability point at
  // distance 2, keeping things in a visualizable range at the ±0.3 init scale.
  // This is a real probabilistic objective, not just a layout.
  relatedness(i: number, j: number): number {
    const d = Math.hypot(this.vec[i][0] - this.vec[j][0], this.vec[i][1] - this.vec[j][1]);
    return 1 / (1 + Math.exp(d - 2));
  }

  // True gradient-descent step on L = −[t·log p + (1−t)·log(1−p)], p = σ(2−d).
  // dL/dv_i = (p − t)·(v_j − v_i)/d, so a descent step moves along the UNIT gap
  // direction by g = lr·(t − p). Dividing by d (the gradient of distance) is what
  // makes this exact — and since |v_j − v_i| = d, the step size is bounded by lr.
  private step(i: number, j: number, g: number) {
    const v = this.vec;
    const dx = v[j][0] - v[i][0];
    const dy = v[j][1] - v[i][1];
    const d = Math.hypot(dx, dy);
    if (d < 1e-9) return;
    const ux = dx / d;
    const uy = dy / d;
    v[i][0] += g * ux;
    v[i][1] += g * uy;
    v[j][0] -= g * ux;
    v[j][1] -= g * uy;
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

  /** One epoch of real gradient descent. For each co-occurring pair (target 1)
   *  and a few non-co-occurring negatives (target 0) the model predicts
   *  relatedness p, then steps by lr·(target − p) along the gap direction.
   *  Returns the mean binary cross-entropy loss (it should fall). */
  trainEpoch(lr = 0.5, negK = 4): number {
    let lossSum = 0;
    let count = 0;
    const eps = 1e-9;
    for (const [i, j] of this.pairs) {
      const p = this.relatedness(i, j); // target 1
      this.step(i, j, lr * (1 - p)); // pull together
      lossSum += -Math.log(p + eps);
      count++;
      for (const n of this.sampleNegatives(i, negK)) {
        const pn = this.relatedness(i, n); // target 0
        this.step(i, n, lr * (0 - pn)); // push apart (negative g → away)
        lossSum += -Math.log(1 - pn + eps);
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
    this.step(i, j, lr * (1 - pPos)); // target 1 → pull
    for (const { n, p } of negInfo) {
      this.step(i, n, lr * (0 - p)); // target 0 → push
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
