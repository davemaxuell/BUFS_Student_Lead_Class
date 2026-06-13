// Project high-dimensional vectors down to 3D with PCA, using the "dual" trick:
// eigendecompose the small N×N Gram matrix instead of the D×D covariance, so it
// stays cheap even though embeddings have hundreds of dimensions. Power
// iteration + deflation gives the top 3 components.

export function pca3(vectors: number[][]): number[][] {
  const N = vectors.length;
  if (N === 0) return [];
  const D = vectors[0].length;

  // center each dimension
  const mean = new Array(D).fill(0);
  for (const v of vectors) for (let d = 0; d < D; d++) mean[d] += v[d];
  for (let d = 0; d < D; d++) mean[d] /= N;
  const Xc = vectors.map((v) => v.map((x, d) => x - mean[d]));

  // Gram matrix (N×N)
  const G: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      let s = 0;
      for (let d = 0; d < D; d++) s += Xc[i][d] * Xc[j][d];
      G[i][j] = s;
      G[j][i] = s;
    }
  }

  const norm = (w: number[]) => {
    let s = 0;
    for (const x of w) s += x * x;
    return Math.sqrt(s) || 1;
  };

  const coords = Array.from({ length: N }, () => [0, 0, 0]);
  const M = G.map((r) => r.slice());

  for (let k = 0; k < 3; k++) {
    let v = Array.from({ length: N }, () => Math.random() - 0.5);
    for (let it = 0; it < 200; it++) {
      const w = new Array(N).fill(0);
      for (let i = 0; i < N; i++) {
        let s = 0;
        const Mi = M[i];
        for (let j = 0; j < N; j++) s += Mi[j] * v[j];
        w[i] = s;
      }
      const nrm = norm(w);
      for (let i = 0; i < N; i++) w[i] /= nrm;
      v = w;
    }
    // eigenvalue λ = vᵀ M v
    let lambda = 0;
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (let j = 0; j < N; j++) s += M[i][j] * v[j];
      lambda += v[i] * s;
    }
    const scale = Math.sqrt(Math.max(lambda, 0));
    for (let i = 0; i < N; i++) coords[i][k] = v[i] * scale;
    // deflate: M -= λ v vᵀ
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) M[i][j] -= lambda * v[i] * v[j];
  }

  return coords;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
