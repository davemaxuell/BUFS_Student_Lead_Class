// Lazily loads a REAL multilingual translation model (m2m100_418M) via
// transformers.js, on demand. Powers the live English<->Korean auto-fill in the
// token-tax puzzle. Large one-time download (~250-400MB), browser-cached after.

/* eslint-disable @typescript-eslint/no-explicit-any */
let cache: any = null;
let loading: Promise<any> | null = null;

export function loadTranslator(onProgress?: (pct: number) => void): Promise<any> {
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
    const pipe = await pipeline("translation", "Xenova/m2m100_418M", {
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

// Translate `text` from src language code to tgt (m2m100 uses ISO codes: "en", "ko").
export async function translate(text: string, src: string, tgt: string): Promise<string> {
  const t = await loadTranslator();
  const out: any = await t(text, { src_lang: src, tgt_lang: tgt });
  const first = Array.isArray(out) ? out[0] : out;
  return (first?.translation_text ?? "").trim();
}
