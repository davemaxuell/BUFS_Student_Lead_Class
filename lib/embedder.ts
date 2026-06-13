// Lazily loads a REAL sentence-embedding model (all-MiniLM-L6-v2) via
// transformers.js, on demand. Used by the 3D word-vector explorer.

/* eslint-disable @typescript-eslint/no-explicit-any */
let cache: any = null;
let loading: Promise<any> | null = null;

export function loadEmbedder(onProgress?: (pct: number) => void): Promise<any> {
  if (cache) {
    onProgress?.(100);
    return Promise.resolve(cache);
  }
  if (loading) return loading;
  loading = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    // Aggregate per-file download progress into one overall percentage.
    const sizes: Record<string, { loaded: number; total: number }> = {};
    const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (p: { status?: string; file?: string; loaded?: number; total?: number }) => {
        if (p?.status === "progress" && p.file && typeof p.total === "number" && p.total > 0) {
          sizes[p.file] = { loaded: p.loaded || 0, total: p.total };
          let l = 0;
          let tot = 0;
          for (const k in sizes) {
            l += sizes[k].loaded;
            tot += sizes[k].total;
          }
          if (tot > 0) onProgress?.(Math.min(99, Math.round((l / tot) * 100)));
        }
      },
    });
    onProgress?.(100);
    cache = pipe;
    return pipe;
  })();
  return loading;
}

export async function embed(pipe: any, word: string): Promise<number[]> {
  const t = await pipe(word, { pooling: "mean", normalize: true });
  return Array.from(t.data as Float32Array);
}
