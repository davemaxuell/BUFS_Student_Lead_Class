// Lazily loads real model tokenizers (BERT WordPiece, XLM-R SentencePiece,
// GPT-2 BPE) via transformers.js. Loaded only on demand (dynamic import) so the
// heavy library never enters the initial bundle and the rest of the app stays
// instant and offline-capable.

export type RealTok = {
  name: string;
  marker: "##" | "▁" | "Ġ";
  special: { start: string; end: string } | null;
  tokenize: (t: string) => string[];
};

let cache: RealTok[] | null = null;
let loading: Promise<RealTok[]> | null = null;

export function loadRealTokenizers(onProgress?: (pct: number) => void): Promise<RealTok[]> {
  if (cache) {
    onProgress?.(100);
    return Promise.resolve(cache);
  }
  if (loading) return loading;

  loading = (async () => {
    const { AutoTokenizer, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    // aggregate per-file download progress across all three tokenizers
    const sizes: Record<string, { loaded: number; total: number }> = {};
    const progress_callback = (p: { status?: string; file?: string; loaded?: number; total?: number }) => {
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
    };

    const specs: { name: string; id: string; marker: RealTok["marker"] }[] = [
      { name: "BERT-multilingual · WordPiece", id: "Xenova/bert-base-multilingual-cased", marker: "##" },
      { name: "XLM-RoBERTa · SentencePiece", id: "Xenova/xlm-roberta-base", marker: "▁" },
      { name: "GPT-2 · BPE", id: "Xenova/gpt2", marker: "Ġ" },
    ];

    const toks = await Promise.all(
      specs.map(async (s) => {
        const t = await AutoTokenizer.from_pretrained(s.id, { progress_callback });
        // Derive the start/end special tokens this model adds (e.g. [CLS] … [SEP])
        // by comparing a full encode (which adds them) against the raw token list.
        let special: { start: string; end: string } | null = null;
        try {
          const probe = "Aa";
          const full = (t.encode(probe) as number[]).map((id) => t.decode([id]));
          const content = t.tokenize(probe) as string[];
          if (full.length >= content.length + 2) {
            special = { start: full[0], end: full[full.length - 1] };
          }
        } catch {
          special = null;
        }
        return {
          name: s.name,
          marker: s.marker,
          special,
          tokenize: (txt: string) => (txt ? (t.tokenize(txt) as string[]) : []),
        };
      })
    );

    onProgress?.(100);
    cache = toks;
    return toks;
  })();

  return loading;
}
