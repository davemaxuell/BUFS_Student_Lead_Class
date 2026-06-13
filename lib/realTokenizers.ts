// Lazily loads real model tokenizers (BERT WordPiece, XLM-R SentencePiece,
// GPT-2 BPE) via transformers.js. Loaded only on demand (dynamic import) so the
// heavy library never enters the initial bundle and the rest of the app stays
// instant and offline-capable.

export type RealTok = { name: string; marker: "##" | "▁" | "Ġ"; tokenize: (t: string) => string[] };

let cache: RealTok[] | null = null;
let loading: Promise<RealTok[]> | null = null;

export function loadRealTokenizers(): Promise<RealTok[]> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;

  loading = (async () => {
    const { AutoTokenizer, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    const specs: { name: string; id: string; marker: RealTok["marker"] }[] = [
      { name: "BERT-multilingual · WordPiece", id: "Xenova/bert-base-multilingual-cased", marker: "##" },
      { name: "XLM-RoBERTa · SentencePiece", id: "Xenova/xlm-roberta-base", marker: "▁" },
      { name: "GPT-2 · BPE", id: "Xenova/gpt2", marker: "Ġ" },
    ];

    const toks = await Promise.all(
      specs.map(async (s) => {
        const t = await AutoTokenizer.from_pretrained(s.id);
        return {
          name: s.name,
          marker: s.marker,
          tokenize: (txt: string) => (txt ? (t.tokenize(txt) as string[]) : []),
        };
      })
    );

    cache = toks;
    return toks;
  })();

  return loading;
}
