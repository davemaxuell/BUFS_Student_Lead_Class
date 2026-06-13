// Lazily loads a REAL sentence-embedding model (all-MiniLM-L6-v2) via
// transformers.js, on demand. Used by the 3D word-vector explorer.

/* eslint-disable @typescript-eslint/no-explicit-any */
let cache: any = null;
let loading: Promise<any> | null = null;

export function loadEmbedder(): Promise<any> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;
  loading = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    cache = pipe;
    return pipe;
  })();
  return loading;
}

export async function embed(pipe: any, word: string): Promise<number[]> {
  const t = await pipe(word, { pooling: "mean", normalize: true });
  return Array.from(t.data as Float32Array);
}
