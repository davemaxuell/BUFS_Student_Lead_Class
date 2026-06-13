# 4‑Hour Lecture Plan — NLP / LLM Basics, Preprocessing & Tokenization (KR vs EN vs Low‑Resource)

**Audience:** mostly non‑CS majors → keep jargon light, lead with analogies & live demos.
**Format chosen:** *Demo‑driven* (you drive demos on the projector; students predict & vote) **+ light hands‑on** (students have laptops + wifi).
**Goal:** *Balanced* — solid concepts **and** a few tangible skills (read a tokenizer, explain why Korean costs more).
**Source grounding:** *Natural Language Processing with Transformers* (Tunstall, von Werra, Wolf, 2022) — Ch.1, 2, 3, 4, 10.

---

## 0. The single anchor that ties everything together

> **"Why does the *same sentence* cost 2–3× more in Korean than in English?"**

You will open with this puzzle (live token count), build all four topics as the tools needed to explain it, and close by solving it. Everything hangs on this one thread.

The "aha": **subword tokenization was literally invented to handle Korean & Japanese** (WordPiece = Schuster & Nakajima, *"Japanese and Korean Voice Search,"* 2012). Word-splitting breaks on Korean's attached particles (조사/어미); subwords fix it; languages with little training data still get penalized → the **"token tax."**

---

## 1. Tools to pre-load in browser tabs (free, no install)

| Tool | URL | Used for |
|---|---|---|
| **Tiktokenizer** | tiktokenizer.vercel.app | Live token count + colored token view (main demo) |
| **OpenAI Tokenizer** | platform.openai.com/tokenizer | Simple token count backup |
| **HF "Tokenizer Playground"** | huggingface.co/spaces (search "Tokenizer Playground") | Compare BERT vs GPT‑2 vs others side‑by‑side |
| **A chatbot** | ChatGPT / Claude / Gemini | "What is an LLM" live demo |
| **Google Translate** | translate.google.com | Generate parallel KR/EN/other sentences live |
| **Unicode inspector** (optional) | any "unicode code point lookup" site | Show NFC vs NFD bytes for 한글 |

> **Contingency if wifi dies:** take screenshots of every demo *in advance* and drop them on backup slides. The lecture must survive offline.

---

## 2. Timeline at a glance (240 min, 3 breaks)

| Time | Block | Topic | Core demo |
|---|---|---|---|
| 0:00–0:55 | **Block 1** | NLP & LLM basics + the hook | Chatbot + first token count |
| 0:55–1:05 | ☕ Break | | |
| 1:05–2:00 | **Block 2** | Text preprocessing & normalization (정규화) | NFC/NFD 한글 + "Café/CAFÉ" |
| 2:00–2:10 | ☕ Break | | |
| 2:10–3:05 | **Block 3** | Tokenization compared: char / word / subword | Side‑by‑side tokenizers |
| 3:05–3:15 | ☕ Break | | |
| 3:15–4:00 | **Block 4** | KR vs EN vs low‑resource + token tax + wrap | The puzzle, solved |

**Pacing rule for non‑CS:** every ~12–15 min = 1 idea → 1 analogy → 1 demo → 1 "predict & vote." Never two abstract slides in a row.

---

## BLOCK 1 — What is NLP & an LLM? (0:00–0:55)

**Objective:** Students can explain, in plain words, what NLP and an LLM are, and that a model reads *tokens*, not words.

1. **(5 min) Cold-open puzzle.** Project tiktokenizer. Paste an English sentence and the *same* sentence in Korean. **Don't explain yet** — just ask: *"Which one is more 'work' for the AI? Vote."* Reveal the token counts. Promise: "By the end you'll know exactly why — and why it matters for cost and fairness." (Leave the numbers on a corner of the board all day.)
2. **(10 min) What is NLP? (자연어처리)** Analogy: *teaching a computer to read, write, and listen to human language.* Everyday examples they already use: 자동완성, 번역, 스팸 필터, 음성비서(Siri/Bixby), 검색.
3. **(12 min) What is an LLM? (거대언어모델)** Live demo: ask a chatbot one question. Core mental model — **"a very powerful autocomplete":** it predicts the next chunk of text, over and over. Analogy: 휴대폰 자동완성 on steroids, trained on a huge slice of the internet. Mention transformers (2017, *"Attention Is All You Need"*) as the engine — *one sentence*, no math.
4. **(10 min) The key reveal: the model doesn't see words — it sees *tokens*.** Show the colored tokens in tiktokenizer. Define **token = a chunk of text the model reads (a piece of a word, a word, or a symbol).** This is the bridge to the whole rest of the day.
5. **(13 min) Hands-on #1 (warm-up).** Students open tiktokenizer, paste any English sentence, and find: *How many tokens? Does every word = one token?* (e.g., "tokenization" often splits). Show 2–3 on screen. **Check:** "What's a token, in your own words?"

> Slides: 1 hook, 1 "NLP around you," 1 "LLM = autocomplete," 1 "models read tokens."

---

## BLOCK 2 — Text Preprocessing & Normalization / 정규화 (1:05–2:00)

**Objective:** Students understand *why* raw text must be cleaned, and can name the main normalization steps — with a Korean-specific gotcha.

1. **(8 min) Why clean text first?** Analogy: *before cooking you wash & chop the ingredients.* To a computer, `"Hello"`, `"hello"`, `"HELLO "`, `"héllo"` can all look like **different** things. Preprocessing makes them comparable.
2. **(12 min) The normalization (정규화) toolkit** — show each live by editing text in the tokenizer:
   - **Lowercasing** — "Café" vs "café" (note: BERT's `distilbert-base-uncased` lowercases automatically; some models don't).
   - **Whitespace / punctuation** — trimming spaces, handling `!!!`, emojis 😅.
   - **Accent / Unicode normalization (NFC/NFD/NFKC)** — the deep one ↓
3. **(15 min) ⭐ The Korean Unicode demo (the memorable one).** Type "한" two ways: precomposed (1 code point) vs decomposed jamo ㅎ+ㅏ+ㄴ (3 code points). They **look identical** but are different bytes → search/dedup/login can silently fail. Real-world relatable case: **macOS (NFD) vs Windows (NFC) filenames** — Korean filenames that "break" when shared. *This is normalization mattering in their daily life.* (Book Ch.4: the tokenizer pipeline starts with Unicode normalization — NFC/NFD/NFKC/NFKD.)
4. **(10 min) Modern twist.** Old NLP did *heavy* manual cleaning (stopword removal, stemming). Modern LLMs do **much less** — the tokenizer + the model handle most of it. So "preprocessing" today = mostly **normalization + tokenization**, which is why those are our focus.
5. **(10 min) Hands-on #2.** Students paste the same word with/without a trailing space, different case, or composed/decomposed 한글, and watch the token IDs change. **Check (predict & vote):** "Will `hello` and `Hello ` (with space) be the same tokens? Why does it matter?"

> Slides: 1 "wash & chop" analogy, 1 normalization checklist, 1 big NFC/NFD 한글 visual, 1 "modern LLMs clean less."

---

## BLOCK 3 — Tokenization Compared: Character / Word / Subword (2:10–3:05)

**Objective:** Students can compare the three tokenization strategies and explain the trade-offs (the heart of the lecture).

1. **(8 min) Three ways to "cut" text.** Analogy: cutting a sentence into pieces — you can cut into **letters**, **words**, or **LEGO bricks (subwords)**.
2. **(10 min) Character tokenization (문자 단위).** Demo: split into single characters. ✅ tiny vocabulary, never "unknown," handles typos/emojis. ❌ sequences get very long; the model must learn what a "word" even is from scratch → needs huge compute/data. *(Book Ch.2.)*
3. **(12 min) Word tokenization (단어 단위).** Demo: split on spaces. ✅ intuitive, short sequences. ❌ **vocabulary explosion** + the **OOV / UNK problem (미등록 단어)** — any new/rare/misspelled word becomes "unknown." Tease Korean: *"학교, 학교에서, 학교를 — same word?"* (English needs ~hundreds of thousands of words; impractical.)
4. **(15 min) ⭐ Subword tokenization (서브워드) — the winner.** The "best of both": keep **frequent words whole**, split **rare words into reusable pieces.** Demo in HF Playground: `"tokenizing"` → `token` + `##izing` (BERT's **WordPiece**; `##` = "glue to previous"). Name the algorithms simply:
   - **BPE / Byte‑Pair Encoding** — repeatedly merge the most frequent pair of pieces (used by GPT).
   - **WordPiece** — BERT's variant (the *"Japanese and Korean Voice Search"* origin story 🎯).
   - **SentencePiece (Unigram)** — multilingual models (XLM‑R); works even for languages **without spaces**, marks spaces with `▁`. *(Book Ch.4.)*
5. **(10 min) Hands-on #3 (compare!).** In the HF Tokenizer Playground, paste the **same sentence** and compare **GPT‑2 vs BERT** token splits. Then try a made-up/slang word and watch it shatter into subwords. **Check:** fill the trade-off table (below) together.

| | Character | Word | **Subword** |
|---|---|---|---|
| Vocab size | tiny | huge | medium ✅ |
| Unknown words? | never | frequent ❌ | rare ✅ |
| Sequence length | long ❌ | short | medium ✅ |
| Used by | rare | old NLP | **BERT, GPT, all modern LLMs** ✅ |

> Slides: 1 "3 ways to cut," 1 per method, 1 trade-off table, 1 origin-story 🎯.

---

## BLOCK 4 — Korean vs English vs Low-Resource: the Token Tax (3:15–4:00)

**Objective:** Students explain *why* languages tokenize differently and why low-resource languages are disadvantaged — solving the opening puzzle.

1. **(10 min) ⭐ Solve the puzzle.** Re-run the morning's KR/EN token count. Now they have the tools to explain it:
   - **Korean is agglutinative (교착어):** particles & endings attach to stems — `학교(school) + 에서(at) + 는` — so *word* tokenization explodes, and *subword* tokenizers still need many pieces.
   - **Morphemes (형태소)** are the real meaning units in Korean — tokenizers trained mostly on English don't align with them.
   - **Less Korean in the training data** → the tokenizer learned fewer Korean chunks → Korean words get shattered into more, smaller pieces → **more tokens per sentence.**
2. **(12 min) Why the "token tax" matters (저자원 언어).** More tokens =
   - 💸 **costs more** (APIs bill *per token*),
   - 🐢 **slower** responses,
   - 📏 **hits the context limit sooner** (a model reads a fixed max # of tokens — 문맥 길이),
   - 📉 often **worse quality.**
   For **low-resource languages** (little data online) it's worst of all — sometimes split down to raw bytes. **Fairness framing:** speakers of under-resourced languages pay more and get worse AI from the *same* system. Great cross-disciplinary discussion for non‑CS majors (정책/언어학/경영/윤리).
3. **(8 min) How the field copes.** Multilingual models like **XLM‑RoBERTa** train on 100 languages at once → **zero-shot cross-lingual transfer** (learn a task in one language, apply in another). But it **breaks down** when a language is very different or wasn't in the training set — exactly the low-resource case. *(Book Ch.4.)*
4. **(10 min) Discussion + wrap.** Prompt: *"You're building an app for users in [their field]. How does the token tax change your choices?"* Recap the through-line: **text → normalize → tokenize → tokens → model**, and *who pays the tax.*
5. **(5 min) Glossary card + take-home** (below).

> Slides: 1 puzzle-solved, 1 "token tax" icons, 1 fairness/discussion, 1 recap pipeline.

---

## 3. Korean ↔ English glossary card (print & hand out)

| English | 한국어 | Plain meaning |
|---|---|---|
| NLP | 자연어처리 | Computers working with human language |
| LLM | 거대언어모델 | A huge model that predicts text |
| Token | 토큰 | A chunk the model reads (≠ always a word) |
| Tokenization | 토큰화 | Cutting text into tokens |
| Vocabulary | 어휘집 | The fixed list of tokens a model knows |
| OOV / UNK | 미등록 단어 | A word not in the vocabulary |
| Normalization | 정규화 | Standardizing text (case, spacing, Unicode) |
| Subword | 서브워드 | Pieces between a letter and a word |
| BPE / WordPiece / SentencePiece | — | Subword algorithms (GPT / BERT / multilingual) |
| Embedding | 임베딩 | Turning a token into numbers |
| Morpheme | 형태소 | Smallest meaning unit (key for Korean) |
| Agglutinative | 교착어 | Korean attaches particles/endings to stems |
| Low-resource language | 저자원 언어 | A language with little training data |
| Context window | 문맥 길이 | Max tokens a model reads at once |
| Pretraining / Fine-tuning | 사전학습 / 미세조정 | Train broadly / adapt to a task |

---

## 4. Engagement & assessment toolkit

- **Predict → Reveal → Explain** before every demo (vote by hands, or Mentimeter/Padlet).
- **One-minute paper** at each break: "Write one thing you learned + one thing still fuzzy."
- **Exit ticket:** *Explain the token tax to a friend in 2 sentences.*
- **Optional take-home (5 min):** "Tokenize a sentence in your favorite language at tiktokenizer; report the EN vs your-language ratio and one sentence on why."

---

## 5. How to flex this plan

- **Less time / lower energy room →** drop Block 3 hands-on, keep the 3 demos; shrink to 3h by merging Blocks 1–2.
- **More hands-on appetite →** add a pre-baked Google Colab (no coding: just "Run") that tokenizes their text with `transformers`.
- **Pure-awareness audience →** cut algorithm names (BPE/WordPiece/SentencePiece), keep the analogies + token tax.
- **If wifi fails →** switch to pre-captured screenshots; the narrative is unchanged.
