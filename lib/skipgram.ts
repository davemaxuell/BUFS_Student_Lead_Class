// A genuinely real skip-gram language model (word2vec, full softmax) in 2-D, so
// the WHOLE training pipeline is watchable for one token:
//   token ID → embedding lookup → output weights → scores → softmax → loss
//   → backprop → update embeddings AND weights.
// Same toy corpus as the cluster view, so the vocabulary matches.

import { DOCS } from "./embedTrain";

const GROUP_LISTS = [
  ["king", "queen", "throne", "crown", "prince", "royal"],
  ["dog", "cat", "pet", "puppy", "kitten", "animal"],
  ["apple", "banana", "fruit", "grape", "sweet", "juice"],
  ["one", "two", "three", "four", "number", "count"],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Forward = { scores: number[]; probs: number[] };
export type StepInfo = {
  scores: number[];
  probs: number[];
  loss: number;
  dscore: number[]; // ∂loss/∂score_k = prob_k − (k==target)
  dE: number[]; // ∂loss/∂(center embedding)
};

export class SkipGram {
  words: string[];
  group: number[];
  V: number;
  d = 2;
  E: number[][] = []; // input embeddings (V × d) — the vectors we plot & train
  W: number[][] = []; // output weights (V × d) — score each token as a context
  coocc: Set<number>[] = [];

  constructor() {
    const groupOf: Record<string, number> = {};
    GROUP_LISTS.forEach((g, gi) => g.forEach((w) => (groupOf[w] = gi)));
    const set = new Set<string>();
    for (const doc of DOCS) for (const w of doc) set.add(w);
    this.words = Array.from(set);
    this.V = this.words.length;
    this.group = this.words.map((w) => groupOf[w] ?? 0);
    const idx = new Map(this.words.map((w, i) => [w, i]));
    this.coocc = this.words.map(() => new Set<number>());
    for (const doc of DOCS) {
      for (let i = 0; i < doc.length; i++) {
        for (let j = 0; j < doc.length; j++) {
          if (i !== j) this.coocc[idx.get(doc[i])!].add(idx.get(doc[j])!);
        }
      }
    }
    this.reset(1);
  }

  reset(seed: number) {
    const rnd = mulberry32(seed);
    const init = () => this.words.map(() => [(rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.8]);
    this.E = init();
    this.W = init();
  }

  private dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1];
  }

  // raw scores (logits): how strongly the center predicts each token as context
  scores(c: number): number[] {
    return this.W.map((wk) => this.dot(this.E[c], wk));
  }

  softmax(s: number[]): number[] {
    const m = Math.max(...s);
    const ex = s.map((v) => Math.exp(v - m));
    const z = ex.reduce((a, b) => a + b, 0) || 1;
    return ex.map((e) => e / z);
  }

  forward(c: number): Forward {
    const scores = this.scores(c);
    return { scores, probs: this.softmax(scores) };
  }

  contexts(c: number): number[] {
    return Array.from(this.coocc[c]);
  }

  /** Everything for one (center, true-context) example — WITHOUT changing weights. */
  compute(c: number, target: number): StepInfo {
    const { scores, probs } = this.forward(c);
    const loss = -Math.log(probs[target] + 1e-12);
    const dscore = probs.map((p, k) => p - (k === target ? 1 : 0));
    const dE = [0, 0];
    for (let k = 0; k < this.V; k++) {
      dE[0] += dscore[k] * this.W[k][0];
      dE[1] += dscore[k] * this.W[k][1];
    }
    return { scores, probs, loss, dscore, dE };
  }

  /** Apply one gradient step for (center, target): updates BOTH the output
   *  weights W and the center's embedding E[c]. Returns the pre-update info. */
  applyUpdate(c: number, target: number, lr = 0.2): StepInfo {
    const info = this.compute(c, target);
    const ec = [this.E[c][0], this.E[c][1]];
    for (let k = 0; k < this.V; k++) {
      this.W[k][0] -= lr * info.dscore[k] * ec[0];
      this.W[k][1] -= lr * info.dscore[k] * ec[1];
    }
    this.E[c][0] -= lr * info.dE[0];
    this.E[c][1] -= lr * info.dE[1];
    return info;
  }

  /** One full sweep over every (center, context) pair — for bulk training. */
  trainEpoch(lr = 0.2): number {
    let lossSum = 0;
    let count = 0;
    for (let c = 0; c < this.V; c++) {
      for (const t of this.coocc[c]) {
        lossSum += this.applyUpdate(c, t, lr).loss;
        count++;
      }
    }
    return lossSum / Math.max(count, 1);
  }
}
