// Lazily loads a REAL multilingual BERT fill-mask pipeline (transformers.js).
// Loaded only on demand — the model weights are larger than the tokenizer
// files, so this never touches the initial bundle/page load.

/* eslint-disable @typescript-eslint/no-explicit-any */
let cache: any = null;
let loading: Promise<any> | null = null;

export function loadFillMask(): Promise<any> {
  if (cache) return Promise.resolve(cache);
  if (loading) return loading;
  loading = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    const pipe = await pipeline("fill-mask", "Xenova/bert-base-multilingual-cased");
    cache = pipe;
    return pipe;
  })();
  return loading;
}
