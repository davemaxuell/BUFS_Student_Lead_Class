# How Machines Read Text — Tokenization Visualizer 🧩

Interactive, **bilingual (English / 한국어)** teaching visuals for an intro NLP lecture. Everything runs **client-side in the browser** using the real GPT tokenizer (`gpt-tokenizer`, `cl100k_base`) — no API keys, no server, no data leaves the device.

## What's inside

| Section | What students do |
|---|---|
| **The Puzzle** | Type the same meaning in EN & KR, watch token counts diverge live |
| **Tokenization** | One input split three ways — character / word / subword — side by side |
| **Real tokenizers** | Live BERT (WordPiece `##`), XLM-R (SentencePiece `▁`) & GPT-2 (BPE) — loaded on demand |
| **Cost calculator** | Estimate $/₩ for processing N messages in EN vs KR — the token tax in money |
| **Normalization** | See how 한글 (composed vs decomposed) looks identical but isn't equal |
| **Token Tax** | A bar chart of the *same sentence* across 8 languages → low-resource cost |
| **Glossary** | Bilingual KR↔EN vocabulary card |

Toggle 🌐 EN/KR anytime — all copy switches instantly.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy to Vercel (free)

**Option A — dashboard (no CLI):**
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), "Import" the repo.
3. Framework preset auto-detects **Next.js** — click **Deploy**. Done.

**Option B — CLI:**
```bash
npm i -g vercel
vercel            # follow prompts, accept defaults
vercel --prod     # ship to production
```

No environment variables are required.

## Tech
- Next.js 15 (App Router) + React 19 + TypeScript
- `gpt-tokenizer` for real byte-pair token counts
- `Intl.Segmenter` for grapheme-correct character counts (handles Korean & emoji)
- Zero external API calls

## Teaching notes
- The **Tokenization** panel uses **GPT's BPE** and works 100% offline. The **Real tokenizers** panel additionally loads BERT **WordPiece** (`##`), XLM-R **SentencePiece** (`▁`) and GPT-2 **BPE** live via `@huggingface/transformers` — it lazy-loads on a button click (downloads a few MB of tokenizer files from the Hugging Face CDN the first time, then caches). If there's no internet, that panel shows a friendly message and everything else still works.
- These same three real tokenizers are also in the companion **Colab notebook** (`tokenization_demo.ipynb`), with a bar chart.
- Pair with the printable **glossary + worksheet** and **answer key** (the two `.html` files in the parent folder).

> Build note: `next.config.mjs` aliases `onnxruntime-node` and `sharp` to `false`. We only use the pure-JS tokenizers (never run model inference), so the native ONNX runtime isn't needed — this keeps the build clean.

Grounded in *Natural Language Processing with Transformers* (Tunstall, von Werra & Wolf, O'Reilly, 2022).
