"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type Lang = "en" | "ko";
type Bi = { en: string; ko: string };

// ---------------------------------------------------------------------------
// All user-facing copy lives here, bilingual. Components read S.section.key[lang].
// ---------------------------------------------------------------------------
export const S = {
  meta: {
    title: { en: "How Machines Read Text", ko: "기계는 글을 어떻게 읽을까" },
    subtitle: {
      en: "An interactive lesson on tokenization, normalization & the low-resource “token tax”.",
      ko: "토큰화 · 정규화 · 저자원 언어 ‘토큰세(tax)’를 직접 만져보는 인터랙티브 수업.",
    },
  },
  nav: {
    puzzle: { en: "The Puzzle", ko: "퍼즐" },
    tokenize: { en: "Tokenization", ko: "토큰화" },
    normalize: { en: "Normalization", ko: "정규화" },
    tax: { en: "Token Tax", ko: "토큰세" },
    glossary: { en: "Glossary", ko: "용어집" },
  },
  langToggle: { en: "한국어", ko: "English" },

  hero: {
    eyebrow: { en: "START HERE · THE PUZZLE", ko: "여기서 시작 · 퍼즐" },
    title: {
      en: "Why does the same sentence cost more in Korean?",
      ko: "왜 같은 문장이 한국어에서는 더 비쌀까?",
    },
    body: {
      en: "AI language models don't read words — they read tokens (chunks of text). Type the same meaning in English and Korean below, and watch how many tokens each one becomes. The counts come from GPT's real tokenizer, running right in your browser.",
      ko: "AI 언어모델은 ‘단어’가 아니라 토큰(글자 덩어리)을 읽습니다. 같은 뜻을 영어와 한국어로 입력하고, 각각 몇 개의 토큰이 되는지 보세요. 이 숫자는 브라우저에서 실제 GPT 토크나이저로 계산한 값입니다.",
    },
    enLabel: { en: "English", ko: "영어" },
    koLabel: { en: "Korean", ko: "한국어" },
    tokens: { en: "tokens", ko: "토큰" },
    chars: { en: "characters", ko: "글자" },
    ratioPre: { en: "Korean uses", ko: "한국어는 영어보다" },
    ratioPost: { en: "× more tokens than English", ko: "배 더 많은 토큰을 씁니다" },
    ratioSame: { en: "About the same number of tokens.", ko: "토큰 수가 거의 비슷합니다." },
    ratioFlip: { en: "× more tokens than Korean", ko: "배 더 많은 토큰을 씁니다 (영어가)" },
    implication: {
      en: "More tokens means: pay more (APIs bill per token), slower replies, and the model's memory fills up faster. We'll see exactly why by the end.",
      ko: "토큰이 많다는 것은: 비용 증가(API는 토큰 단위 과금) · 느린 응답 · 모델 기억 공간(문맥)이 빨리 참 을 뜻합니다. 끝까지 보면 그 이유를 정확히 알게 됩니다.",
    },
    presets: { en: "Try a preset:", ko: "예시 불러오기:" },
  },

  tok: {
    eyebrow: { en: "THREE WAYS TO CUT TEXT", ko: "텍스트를 자르는 세 가지 방법" },
    title: { en: "Tokenization: how machines slice up language", ko: "토큰화: 기계가 언어를 잘게 쪼개는 법" },
    intro: {
      en: "Type anything (try English and Korean!). The same text is split three ways. Notice how the counts and pieces differ.",
      ko: "아무거나 입력해 보세요(영어·한국어 모두!). 같은 글을 세 가지 방식으로 자릅니다. 개수와 조각이 어떻게 달라지는지 보세요.",
    },
    inputLabel: { en: "Your text", ko: "입력 텍스트" },
    charTitle: { en: "Character", ko: "문자 단위" },
    charKo: { en: "(by letter)", ko: "(글자 하나씩)" },
    wordTitle: { en: "Word", ko: "단어 단위" },
    wordKo: { en: "(by spaces)", ko: "(공백 기준)" },
    subTitle: { en: "Subword", ko: "서브워드" },
    subKo: { en: "(GPT's real BPE)", ko: "(GPT 실제 BPE)" },
    units: { en: "pieces", ko: "개" },
    charDesc: {
      en: "Tiny vocabulary, never “unknown”, handles typos & emoji. But sequences get very long and the model must learn what a word is from scratch.",
      ko: "어휘집이 작고 ‘모르는 단어’가 없으며 오타·이모지도 처리. 하지만 길이가 매우 길어지고, 모델이 ‘단어’ 개념을 처음부터 배워야 함.",
    },
    wordDesc: {
      en: "Intuitive and short. But the vocabulary explodes and any new/rare word becomes “unknown” (UNK). Korean is brutal here: 학교, 학교에서, 학교를 all look like different words.",
      ko: "직관적이고 길이가 짧음. 하지만 어휘집이 폭발하고, 새롭거나 드문 단어는 ‘미등록(UNK)’이 됨. 한국어는 특히 가혹: 학교 · 학교에서 · 학교를 가 전부 다른 단어로 보임.",
    },
    subDesc: {
      en: "The winner used by all modern LLMs: keep common words whole, split rare ones into reusable pieces. Below is GPT-4's actual tokenizer. ‘␣’ marks a space; greyed chips are partial-byte pieces — exactly how Korean often gets shattered.",
      ko: "모든 최신 LLM이 쓰는 방식: 흔한 단어는 통째로, 드문 단어는 재사용 가능한 조각으로 분할. 아래는 GPT-4의 실제 토크나이저. ‘␣’는 공백, 회색 칩은 부분 바이트 조각 — 한국어가 잘게 부서지는 모습이 바로 이것.",
    },
    note: {
      en: "Note: BERT uses a subword method called WordPiece (continuations marked with ‘##’), and multilingual models use SentencePiece (spaces marked with ‘▁’). Compare them all in the companion Colab notebook.",
      ko: "참고: BERT는 WordPiece(이어지는 조각에 ‘##’ 표시)를, 다국어 모델은 SentencePiece(공백을 ‘▁’로 표시)를 씁니다. 함께 제공되는 Colab 노트북에서 모두 비교해 보세요.",
    },
    table: {
      head: { en: "Trade-offs at a glance", ko: "한눈에 보는 장단점" },
      colMethod: { en: "", ko: "" },
      vocab: { en: "Vocabulary size", ko: "어휘집 크기" },
      unk: { en: "Unknown words?", ko: "모르는 단어?" },
      len: { en: "Sequence length", ko: "길이" },
      used: { en: "Used by", ko: "사용처" },
      tiny: { en: "tiny", ko: "아주 작음" },
      huge: { en: "huge", ko: "아주 큼" },
      medium: { en: "medium ✅", ko: "중간 ✅" },
      never: { en: "never ✅", ko: "없음 ✅" },
      often: { en: "frequent ❌", ko: "자주 ❌" },
      rare: { en: "rare ✅", ko: "드묾 ✅" },
      long: { en: "long ❌", ko: "긺 ❌" },
      short: { en: "short", ko: "짧음" },
      med: { en: "medium ✅", ko: "중간 ✅" },
      cRare: { en: "rare today", ko: "요즘 드묾" },
      cOld: { en: "old NLP", ko: "예전 NLP" },
      cMod: { en: "BERT, GPT, all LLMs ✅", ko: "BERT, GPT, 모든 LLM ✅" },
    },
  },

  real: {
    eyebrow: { en: "REAL TOKENIZERS, LIVE", ko: "실제 토크나이저, 실시간" },
    title: {
      en: "WordPiece vs SentencePiece vs BPE — the real models",
      ko: "WordPiece vs SentencePiece vs BPE — 진짜 모델",
    },
    intro: {
      en: "The panel above uses GPT’s BPE. Here are three real tokenizers from actual models, running live in your browser. Watch the markers: BERT uses ## (glue to the previous piece), XLM-R uses ▁ (a space before a word).",
      ko: "위 패널은 GPT의 BPE를 씁니다. 여기서는 실제 모델의 토크나이저 3개가 브라우저에서 실시간 동작합니다. 표시를 보세요: BERT는 ##(앞 조각에 이어붙임), XLM-R은 ▁(단어 앞 공백).",
    },
    loadBtn: { en: "▶ Load real tokenizers (downloads a few MB, once)", ko: "▶ 실제 토크나이저 불러오기 (최초 1회 수 MB 다운로드)" },
    loading: { en: "Downloading tokenizers…", ko: "토크나이저 내려받는 중…" },
    error: {
      en: "Couldn't load (needs internet). The GPT panel above still works offline.",
      ko: "불러오기 실패(인터넷 필요). 위 GPT 패널은 오프라인에서도 동작합니다.",
    },
    retry: { en: "Retry", ko: "다시 시도" },
    inputLabel: { en: "Your text", ko: "입력 텍스트" },
    units: { en: "pieces", ko: "개" },
    note: {
      en: "Tip: paste a Korean sentence and an English one to compare how each model marks word boundaries — and how many more pieces Korean needs.",
      ko: "팁: 한국어 문장과 영어 문장을 붙여넣어 각 모델이 단어 경계를 어떻게 표시하는지, 한국어가 조각을 얼마나 더 쓰는지 비교해 보세요.",
    },
    special: {
      start: { en: "start", ko: "시작" },
      end: { en: "end", ko: "끝" },
      total: { en: "with start/end", ko: "시작/끝 포함" },
      note: {
        en: "👉 Models also add special tokens marking the start and end of the input — and these count as tokens too. BERT adds [CLS] … [SEP]; XLM-R adds <s> … </s>. (GPT-2 adds none here.) They appear as the greyed chips around your text above.",
        ko: "👉 모델은 입력의 시작과 끝을 표시하는 특수 토큰도 추가하며, 이것도 토큰으로 셉니다. BERT는 [CLS] … [SEP], XLM-R은 <s> … </s>를 추가합니다. (GPT-2는 여기서 추가하지 않음.) 위 텍스트 양옆의 회색 칩이 그것입니다.",
      },
    },
  },

  norm: {
    eyebrow: { en: "TIDYING TEXT FIRST", ko: "먼저 글 다듬기" },
    title: { en: "Normalization: when identical-looking text isn't equal", ko: "정규화: 똑같아 보이지만 같지 않은 글자" },
    intro: {
      en: "Before tokenizing, text is cleaned. The sneakiest case: two strings that look identical but are stored as different bytes — so the computer says they're NOT equal. This bites Korean especially (and is the cause of broken filenames between Mac and Windows).",
      ko: "토큰화 전에 글을 정리합니다. 가장 교묘한 경우: 똑같아 보이지만 다른 바이트로 저장돼 컴퓨터가 ‘다르다’고 판단하는 두 문자열. 한국어에서 특히 자주 발생합니다(맥·윈도우 사이 파일명이 깨지는 원인).",
    },
    aLabel: { en: "String A", ko: "문자열 A" },
    bLabel: { en: "String B", ko: "문자열 B" },
    rawEqual: { en: "Raw equal (===)?", ko: "그대로 비교 (===)?" },
    normEqual: { en: "Equal after normalization (NFC)?", ko: "정규화(NFC) 후 비교?" },
    yes: { en: "YES", ko: "예" },
    no: { en: "NO", ko: "아니오" },
    codepoints: { en: "code points", ko: "코드포인트" },
    forms: { en: "Unicode forms", ko: "유니코드 형식" },
    tryThis: { en: "Try these:", ko: "예시:" },
    lesson: {
      en: "Same look, different bytes → search, login, and de-duplication can silently fail. Normalization (NFC/NFD) forces one canonical form so the computer treats them as equal. Lowercasing and trimming spaces are normalization too.",
      ko: "같은 모양, 다른 바이트 → 검색·로그인·중복제거가 조용히 실패할 수 있습니다. 정규화(NFC/NFD)는 하나의 표준 형태로 통일해 컴퓨터가 같다고 보게 합니다. 소문자화와 공백 정리도 정규화의 일종입니다.",
    },
    presets: {
      koComposed: { en: "한글: composed vs decomposed", ko: "한글: 조합형 vs 분해형" },
      cafe: { en: "café: é vs e+◌́", ko: "café: é vs e+◌́" },
      case: { en: "Case + spaces", ko: "대소문자 + 공백" },
    },
  },

  tax: {
    eyebrow: { en: "THE PAYOFF", ko: "결론" },
    title: { en: "The token tax: low-resource languages pay more", ko: "토큰세: 저자원 언어가 더 비싸다" },
    intro: {
      en: "Every bar below is the SAME sentence — “Artificial intelligence is changing the world.” — in a different language, measured with GPT's real tokenizer. English is cheapest because the tokenizer saw the most English. Languages with less training data get shattered into more, smaller pieces.",
      ko: "아래 막대는 모두 같은 문장 — “인공지능이 세상을 바꾸고 있습니다.” — 을 다른 언어로 쓴 것이며, GPT 실제 토크나이저로 측정했습니다. 영어가 가장 싼 이유는 토크나이저가 영어를 가장 많이 봤기 때문. 학습 데이터가 적은 언어일수록 더 잘게 부서집니다.",
    },
    tokens: { en: "tokens", ko: "토큰" },
    vsEn: { en: "× English", ko: "× 영어" },
    why: { en: "Why this happens", ko: "왜 이런 일이 생길까" },
    whyBody: {
      en: "A subword tokenizer is trained on data. It learns big reusable chunks for languages it saw a lot of (English), and only tiny byte-level pieces for languages it barely saw. Korean is agglutinative — particles & endings (조사/어미) attach to stems (학교+에서+는) — so even subwords need many pieces.",
      ko: "서브워드 토크나이저는 데이터로 학습됩니다. 많이 본 언어(영어)는 크고 재사용 가능한 덩어리로, 거의 못 본 언어는 작은 바이트 조각으로만 배웁니다. 한국어는 교착어 — 조사·어미가 어간에 붙어(학교+에서+는) — 서브워드로도 조각이 많이 필요합니다.",
    },
    costs: { en: "What the tax costs", ko: "토큰세의 대가" },
    cost1: { en: "💸 Money — APIs charge per token", ko: "💸 비용 — API는 토큰 단위 과금" },
    cost2: { en: "🐢 Speed — more tokens, slower replies", ko: "🐢 속도 — 토큰이 많을수록 느림" },
    cost3: { en: "📏 Memory — fills the context window sooner", ko: "📏 기억 — 문맥 창이 더 빨리 참" },
    cost4: { en: "⚖️ Fairness — speakers of low-resource languages pay more for worse AI", ko: "⚖️ 공정성 — 저자원 언어 사용자는 더 내고 더 나쁜 AI를 받음" },
    fix: {
      en: "How the field copes: multilingual models like XLM-RoBERTa train on 100 languages at once, enabling zero-shot cross-lingual transfer (learn a task in one language, use it in another). But it breaks down for languages too different or not seen in training — exactly the low-resource case.",
      ko: "대응 방법: XLM-RoBERTa 같은 다국어 모델은 100개 언어를 한 번에 학습해 제로샷 교차언어 전이(한 언어로 배운 과제를 다른 언어에 적용)를 가능케 합니다. 하지만 너무 다르거나 학습에 없던 언어에는 무너집니다 — 바로 저자원 언어의 경우.",
    },
  },

  cost: {
    title: { en: "Try it: the price of the tax", ko: "직접 계산: 토큰세의 가격" },
    intro: {
      en: "A rough estimate. Same app, same number of messages — Korean costs more simply because it becomes more tokens.",
      ko: "대략적인 추정입니다. 같은 앱, 같은 메시지 수라도 한국어는 토큰이 더 많아 비용이 더 듭니다.",
    },
    messages: { en: "Messages processed", ko: "처리할 메시지 수" },
    price: { en: "Price per 1M tokens", ko: "100만 토큰당 가격" },
    currency: { en: "Currency", ko: "통화" },
    perMsg: { en: "tokens / message", ko: "토큰 / 메시지" },
    enCost: { en: "English total", ko: "영어 총비용" },
    koCost: { en: "Korean total", ko: "한국어 총비용" },
    extra: { en: "Extra paid just for using Korean", ko: "한국어를 쓴다는 이유만으로 더 내는 돈" },
  },

  glossary: {
    eyebrow: { en: "VOCABULARY CARD", ko: "용어 카드" },
    title: { en: "Korean ↔ English glossary", ko: "한국어 ↔ 영어 용어집" },
    term: { en: "Term", ko: "용어" },
    kterm: { en: "한국어", ko: "한국어" },
    plain: { en: "Plain meaning", ko: "쉬운 뜻" },
  },

  footer: {
    builtFor: {
      en: "Built for a 4-hour intro lecture on NLP & tokenization. Counts use the gpt-tokenizer (cl100k_base) running fully in your browser — no data leaves your device.",
      ko: "NLP·토큰화 4시간 입문 강의용으로 제작. 토큰 수는 브라우저에서 완전히 실행되는 gpt-tokenizer(cl100k_base)로 계산 — 데이터가 기기를 벗어나지 않습니다.",
    },
    source: {
      en: "Grounded in “Natural Language Processing with Transformers” (Tunstall, von Werra & Wolf, O'Reilly 2022).",
      ko: "“Natural Language Processing with Transformers”(Tunstall, von Werra & Wolf, O'Reilly 2022) 기반.",
    },
  },
};

// Glossary content (bilingual). term=English, kterm=Korean, plain has both.
export const GLOSSARY: { term: string; kterm: string; plain: Bi }[] = [
  { term: "NLP", kterm: "자연어처리", plain: { en: "Computers working with human language", ko: "컴퓨터가 사람의 언어를 다루는 일" } },
  { term: "LLM", kterm: "거대언어모델", plain: { en: "A huge model that predicts text", ko: "글을 예측하는 거대한 모델" } },
  { term: "Token", kterm: "토큰", plain: { en: "A chunk the model reads (not always a word)", ko: "모델이 읽는 덩어리 (꼭 단어는 아님)" } },
  { term: "Tokenization", kterm: "토큰화", plain: { en: "Cutting text into tokens", ko: "글을 토큰으로 자르기" } },
  { term: "Vocabulary", kterm: "어휘집", plain: { en: "The fixed list of tokens a model knows", ko: "모델이 아는 토큰 목록" } },
  { term: "OOV / UNK", kterm: "미등록 단어", plain: { en: "A word not in the vocabulary", ko: "어휘집에 없는 단어" } },
  { term: "Normalization", kterm: "정규화", plain: { en: "Standardizing text (case, spacing, Unicode)", ko: "글 표준화 (대소문자·공백·유니코드)" } },
  { term: "Subword", kterm: "서브워드", plain: { en: "Pieces between a letter and a word", ko: "글자와 단어 사이 크기의 조각" } },
  { term: "BPE / WordPiece / SentencePiece", kterm: "—", plain: { en: "Subword algorithms (GPT / BERT / multilingual)", ko: "서브워드 알고리즘 (GPT / BERT / 다국어)" } },
  { term: "Embedding", kterm: "임베딩", plain: { en: "Turning a token into numbers", ko: "토큰을 숫자로 바꾸기" } },
  { term: "Morpheme", kterm: "형태소", plain: { en: "Smallest meaning unit (key for Korean)", ko: "가장 작은 의미 단위 (한국어 핵심)" } },
  { term: "Agglutinative", kterm: "교착어", plain: { en: "Korean attaches particles/endings to stems", ko: "어간에 조사·어미가 붙는 언어 (한국어)" } },
  { term: "Low-resource language", kterm: "저자원 언어", plain: { en: "A language with little training data", ko: "학습 데이터가 적은 언어" } },
  { term: "Context window", kterm: "문맥 길이", plain: { en: "Max tokens a model reads at once", ko: "모델이 한 번에 읽는 최대 토큰 수" } },
  { term: "Pretraining / Fine-tuning", kterm: "사전학습 / 미세조정", plain: { en: "Train broadly / adapt to a task", ko: "넓게 학습 / 과제에 맞게 조정" } },
];

// ---------------------------------------------------------------------------
// Language context
// ---------------------------------------------------------------------------
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// Convenience: pick a bilingual value for the current language.
export function useT() {
  const { lang } = useLang();
  return useCallback((b: Bi) => b[lang], [lang]);
}
