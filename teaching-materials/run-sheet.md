# 🎬 Run Sheet — 4-Hour Lecture ↔ App Sections (minute-by-minute)

Instructor cheat-sheet. Keep the **app** open in one tab (the live URL) and the **Colab notebook** in another. Each row tells you *what to project*, *what to do*, and *which worksheet/Colab moment* lines up.

**App section anchors** (add to your URL to jump straight there):
`#puzzle` · `#tokenize` · `#real` · `#normalize` · `#tax` · `#glossary`
e.g. `https://your-app.vercel.app/#tokenize`

> 🌐 Use the **EN/KR toggle** (top-right) to match your spoken language at any moment.
> 🗳️ Golden rule: **Predict → Reveal → Explain**. Make them vote *before* you reveal a count.

---

## ⏱️ Block 1 — NLP & LLM Basics + The Hook (0:00–0:55)

| Time | Beat | Project this | What you do |
|---|---|---|---|
| 0:00–0:05 | **Cold-open puzzle** | App `#puzzle` | Paste the EN + KR preset (the "AI" button). **Don't explain.** Ask: "Which is more work for the AI?" → hands-up vote → reveal the **8 vs 17** counts. Promise to solve it by the end. |
| 0:05–0:15 | What is NLP? | (slogan slide / talk) | Everyday examples: 자동완성, 번역, 스팸 필터, 음성비서. |
| 0:15–0:27 | What is an LLM? | A chatbot tab | "Autocomplete on steroids." Ask it one question live. |
| 0:27–0:37 | **Models read *tokens*** | App `#puzzle` | Point at the colored counts again: define **token = a chunk the model reads**. This is the bridge to the whole day. |
| 0:37–0:42 | Worksheet intro | — | Hand out the **Worksheet**. Have them write their **Q1** prediction (EN vs KR). |
| 0:42–0:55 | **Hands-on #1** | App `#tokenize` (students' laptops) | Students type any English sentence → "Does every word = one token?" (e.g. *tokenization* splits). Share 2–3 on screen. |
| **0:55–1:05** | ☕ **Break** | | |

---

## ⏱️ Block 2 — Preprocessing & Normalization / 정규화 (1:05–2:00)

| Time | Beat | Project this | What you do |
|---|---|---|---|
| 1:05–1:13 | Why clean text? | (talk) | "Wash & chop before cooking." `Hello`/`hello`/`héllo` can all look different to a computer. |
| 1:13–1:25 | Normalization toolkit | App `#normalize` | Show case + spaces with the **"Case + spaces"** preset. |
| 1:25–1:42 | ⭐ **Korean Unicode demo** | App `#normalize` | Click **"한글: composed vs decomposed."** Same look, **Raw equal = NO**, **after NFC = YES**. Tie to the Mac↔Windows broken-filename story. Students write **Q3** on the worksheet. |
| 1:42–1:50 | Modern twist | (talk) | Old NLP cleaned a lot by hand; modern LLMs let the tokenizer do most of it → that's why we focus on tokenization next. |
| 1:50–2:00 | **Hands-on #2** | App `#normalize` (laptops) | Type the same word with/without trailing space, or composed/decomposed 한글; watch code-points & bytes change. |
| **2:00–2:10** | ☕ **Break** | | |

---

## ⏱️ Block 3 — Tokenization Compared: char / word / subword (2:10–3:05)

| Time | Beat | Project this | What you do |
|---|---|---|---|
| 2:10–2:18 | 3 ways to cut | App `#tokenize` | "Letters vs words vs LEGO bricks." Load the **KR** example → compare the three counts side-by-side. |
| 2:18–2:28 | Character & Word | App `#tokenize` | Walk the trade-offs. Word panel: show `학교에서` stays one chunk → vocabulary explosion + UNK. Students write **Q2** (`internationalization`). |
| 2:28–2:38 | ⭐ Subword | App `#tokenize` | The winner. Note `internationalization → international + ization`. Read the trade-off table together. |
| 2:38–2:55 | ⭐ **WordPiece vs SentencePiece vs BPE** | App `#real` | Click **"Load real tokenizers."** Show the same KR+EN text in **BERT (`##`)**, **XLM-R (`▁`)**, **GPT-2 (byte fragments)**. The 🎯 fact: WordPiece comes from a 2012 paper *"Japanese and Korean Voice Search."* |
| 2:55–3:05 | **Hands-on #3** | App `#real` (laptops) | Students paste their own sentence and compare how each model marks boundaries / counts pieces. |
| **3:05–3:15** | ☕ **Break** | | |

---

## ⏱️ Block 4 — KR / EN / Low-Resource + Token Tax + Wrap (3:15–4:00)

| Time | Beat | Project this | What you do |
|---|---|---|---|
| 3:15–3:25 | ⭐ **Solve the puzzle** | App `#tax` (bar chart) | Same sentence across 8 languages. Reveal the ranking. Students do **Q4** (rank EN/ZH/KR/Amharic). Connect back to the 0:00 mystery. |
| 3:25–3:35 | What the tax costs | App `#tax` (cost calculator) | Enter messages + price, toggle **$/₩**. Show "extra paid just for Korean." Make it concrete in money. |
| 3:35–3:43 | How the field copes | (talk) | Multilingual models (XLM-R, 100 languages) + zero-shot transfer; breaks down for low-resource. |
| 3:43–3:53 | Discussion | — | "In *your* field, how does the token tax change your choices?" |
| 3:53–4:00 | Wrap + exit ticket | App `#glossary` | Recap the pipeline **text → normalize → tokenize → tokens → model**. Students complete the **Exit Ticket** (explain the token tax in 2 sentences). |

---

## 🧰 Optional / backup
- **Colab notebook** (`tokenization_demo.ipynb`): a deeper alternative to the `#real` panel — students click **Runtime → Run all** and get the bar chart of EN vs KR across all three tokenizers. Good for a longer hands-on slot or homework.
- **No wifi?** The app's `#puzzle`, `#tokenize`, `#normalize`, `#tax` (incl. cost calculator) and `#glossary` all work **offline**. Only `#real` and Colab need internet — pre-screenshot them as backup.
- **Take-home:** open `tiktokenizer.vercel.app` or the app, tokenize a sentence in your favorite language, report the EN-vs-it ratio + one sentence on why.

*Pairs with: `Lecture Plan - NLP Tokenization (4h).md`, `Worksheet & Glossary (printable EN-KR).html`, `Worksheet ANSWER KEY (EN-KR).html`.*
