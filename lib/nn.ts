// A genuinely real, tiny neural network (2 → H tanh → 1 sigmoid) trained with
// real gradient descent / backprop. No fakery — the decision boundary you see
// is this model's live predictions. Runs fine in the browser.

export type Point = { x: number; y: number; label: number };
export type DatasetKind = "blobs" | "circle" | "xor" | "moons" | "spiral";

function randn(): number {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function makeDataset(kind: DatasetKind, n = 160): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    if (kind === "blobs") {
      const label = i % 2;
      const cx = label ? 0.5 : -0.5;
      const cy = label ? 0.5 : -0.5;
      pts.push({ x: cx + randn() * 0.18, y: cy + randn() * 0.18, label });
    } else if (kind === "circle") {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      pts.push({ x, y, label: x * x + y * y < 0.4 ? 1 : 0 });
    } else if (kind === "xor") {
      // xor — not linearly separable; needs the hidden layer
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      pts.push({ x, y, label: x > 0 !== y > 0 ? 1 : 0 });
    } else if (kind === "moons") {
      // two interleaving half-moons — visibly takes a while to separate
      const span = Math.floor(n / 2);
      const k = i < span ? 0 : 1;
      const tt = (Math.PI * ((i < span ? i : i - span))) / span;
      let x: number;
      let y: number;
      if (k === 0) {
        x = Math.cos(tt);
        y = Math.sin(tt);
      } else {
        x = 1 - Math.cos(tt);
        y = 0.4 - Math.sin(tt);
      }
      // uniform scale + center so both moons fit inside [-1, 1]
      pts.push({ x: (x - 0.5) * 0.6 + randn() * 0.04, y: (y - 0.2) * 0.6 + randn() * 0.04, label: k });
    } else {
      // spiral — hard but learnable (one gentle turn); the boundary slowly curls in
      const k = i % 2;
      const frac = i / 2 / (n / 2);
      const r = 0.12 + frac * 0.82;
      const theta = frac * 2 * Math.PI + k * Math.PI;
      pts.push({ x: r * Math.cos(theta) + randn() * 0.015, y: r * Math.sin(theta) + randn() * 0.015, label: k });
    }
  }
  return pts;
}

export class MLP {
  H: number;
  W1: number[][] = [];
  b1: number[] = [];
  W2: number[] = [];
  b2 = 0;
  // momentum velocity buffers — these turn a slow crawl into a clean, decisive boundary
  vW1: number[][] = [];
  vb1: number[] = [];
  vW2: number[] = [];
  vb2 = 0;

  constructor(H = 10) {
    this.H = H;
    this.reset();
  }

  reset() {
    this.W1 = Array.from({ length: this.H }, () => [randn() * 0.9, randn() * 0.9]);
    this.b1 = Array.from({ length: this.H }, () => 0);
    this.W2 = Array.from({ length: this.H }, () => randn() * 0.9);
    this.b2 = 0;
    this.vW1 = Array.from({ length: this.H }, () => [0, 0]);
    this.vb1 = Array.from({ length: this.H }, () => 0);
    this.vW2 = Array.from({ length: this.H }, () => 0);
    this.vb2 = 0;
  }

  forward(x0: number, x1: number): { a1: number[]; y: number } {
    const a1 = new Array<number>(this.H);
    for (let j = 0; j < this.H; j++) {
      a1[j] = Math.tanh(this.W1[j][0] * x0 + this.W1[j][1] * x1 + this.b1[j]);
    }
    let z2 = this.b2;
    for (let j = 0; j < this.H; j++) z2 += this.W2[j] * a1[j];
    return { a1, y: 1 / (1 + Math.exp(-z2)) };
  }

  predict(x0: number, x1: number): number {
    return this.forward(x0, x1).y;
  }

  /**
   * One full-batch gradient-descent epoch with momentum and (decoupled) weight
   * decay. The weight decay pulls weights gently toward zero, which keeps the
   * decision boundary from getting needle-sharp — it settles as a wider-margin
   * separator (the same regularization idea behind an SVM's max-margin line).
   * Returns the binary cross-entropy loss.
   */
  trainEpoch(data: Point[], lr = 0.5, momentum = 0.9, weightDecay = 0.005): number {
    const H = this.H;
    const gW1 = Array.from({ length: H }, () => [0, 0]);
    const gb1 = new Array<number>(H).fill(0);
    const gW2 = new Array<number>(H).fill(0);
    let gb2 = 0;
    let loss = 0;

    for (const p of data) {
      const { a1, y } = this.forward(p.x, p.y);
      const t = p.label;
      loss += -(t * Math.log(y + 1e-9) + (1 - t) * Math.log(1 - y + 1e-9));
      const dz2 = y - t; // dL/dz2 for sigmoid + BCE
      gb2 += dz2;
      for (let j = 0; j < H; j++) {
        gW2[j] += dz2 * a1[j];
        const dz1 = dz2 * this.W2[j] * (1 - a1[j] * a1[j]); // tanh'
        gW1[j][0] += dz1 * p.x;
        gW1[j][1] += dz1 * p.y;
        gb1[j] += dz1;
      }
    }

    const s = lr / data.length;
    const shrink = 1 - lr * weightDecay; // decoupled weight decay (weights only, not biases)
    for (let j = 0; j < H; j++) {
      this.vW2[j] = momentum * this.vW2[j] - s * gW2[j];
      this.W2[j] = this.W2[j] * shrink + this.vW2[j];
      this.vW1[j][0] = momentum * this.vW1[j][0] - s * gW1[j][0];
      this.W1[j][0] = this.W1[j][0] * shrink + this.vW1[j][0];
      this.vW1[j][1] = momentum * this.vW1[j][1] - s * gW1[j][1];
      this.W1[j][1] = this.W1[j][1] * shrink + this.vW1[j][1];
      this.vb1[j] = momentum * this.vb1[j] - s * gb1[j];
      this.b1[j] += this.vb1[j];
    }
    this.vb2 = momentum * this.vb2 - s * gb2;
    this.b2 += this.vb2;
    return loss / data.length;
  }

  accuracy(data: Point[]): number {
    let c = 0;
    for (const p of data) if ((this.predict(p.x, p.y) > 0.5 ? 1 : 0) === p.label) c++;
    return c / data.length;
  }
}
