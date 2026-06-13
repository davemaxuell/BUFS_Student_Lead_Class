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
    learn: { en: "How AI learns", ko: "AI 학습" },
    bpe: { en: "Tokenizer training", ko: "토크나이저 학습" },
    puzzle: { en: "The Puzzle", ko: "퍼즐" },
    tokenize: { en: "Tokenization", ko: "토큰화" },
    normalize: { en: "Normalization", ko: "정규화" },
    tax: { en: "Token Tax", ko: "토큰세" },
    glossary: { en: "Glossary", ko: "용어집" },
  },
  langToggle: { en: "한국어", ko: "English" },

  nnb: {
    eyebrow: { en: "PART 0 · HOW MACHINES LEARN", ko: "0부 · 기계는 어떻게 학습하나" },
    title: { en: "What is a neural network?", ko: "신경망이란 무엇인가?" },
    intro: {
      en: "A neural network is just a big stack of adjustable knobs (called weights). Numbers go in, the network multiplies them by its knobs and adds them up, and an answer comes out. “Learning” means slowly turning the knobs until the answers are right.",
      ko: "신경망은 그저 조절 가능한 손잡이(가중치라고 부름)의 거대한 묶음입니다. 숫자가 들어가면 손잡이로 곱하고 더해 답이 나옵니다. ‘학습’이란 답이 맞을 때까지 손잡이를 조금씩 돌리는 과정입니다.",
    },
    neuronTitle: { en: "Try one neuron", ko: "뉴런 하나 만져보기" },
    neuronHelp: {
      en: "Drag the weights. The neuron multiplies each input by its weight, adds a bias, and squashes the result into an output between 0 and 1.",
      ko: "가중치를 움직여 보세요. 뉴런은 각 입력에 가중치를 곱하고 편향을 더한 뒤, 결과를 0과 1 사이 출력으로 눌러 줍니다.",
    },
    input: { en: "input", ko: "입력" },
    weight: { en: "weight", ko: "가중치" },
    bias: { en: "bias", ko: "편향" },
    sum: { en: "weighted sum", ko: "가중합" },
    output: { en: "output", ko: "출력" },
    takeaway: {
      en: "A real network stacks thousands of these neurons in layers. Training = automatically finding the knob settings that make the outputs correct — which is what you'll watch next.",
      ko: "실제 신경망은 이런 뉴런 수천 개를 층층이 쌓습니다. 학습이란 출력이 맞도록 손잡이 값을 자동으로 찾는 것 — 바로 다음에서 직접 보게 됩니다.",
    },
    sigTitle: { en: "The squash: the sigmoid σ", ko: "눌러주기: 시그모이드 σ" },
    sigDesc: {
      en: "The neuron's last step squashes any number into a 0–1 output using the sigmoid curve. Big negative → near 0, zero → 0.5, big positive → near 1. The dot shows your current weighted sum; press Sweep to watch it slide across.",
      ko: "뉴런의 마지막 단계는 시그모이드 곡선으로 어떤 숫자든 0~1 출력으로 눌러줍니다. 큰 음수 → 0에 가깝게, 0 → 0.5, 큰 양수 → 1에 가깝게. 점은 현재 가중합을 나타내며, ‘쓸기’를 누르면 곡선을 따라 미끄러집니다.",
    },
    sweep: { en: "▶ Sweep", ko: "▶ 쓸기" },
    sweepStop: { en: "⏸ Stop", ko: "⏸ 정지" },
  },

  train: {
    eyebrow: { en: "WATCH IT LEARN", ko: "학습 과정 직접 보기" },
    title: { en: "Training a network to classify", ko: "신경망을 학습시켜 분류하기" },
    intro: {
      en: "Below is a real neural network running in your browser, learning to separate two groups of dots. Press Play and watch the colored boundary bend until it sorts them correctly — and the loss (how wrong it is) fall toward zero.",
      ko: "아래는 브라우저에서 실제로 동작하는 신경망으로, 두 무리의 점을 구분하는 법을 배웁니다. 재생을 눌러 색 경계가 점들을 올바르게 가를 때까지 휘어지고, 손실(얼마나 틀렸는지)이 0으로 떨어지는 것을 보세요.",
    },
    play: { en: "▶ Play", ko: "▶ 재생" },
    pause: { en: "⏸ Pause", ko: "⏸ 일시정지" },
    step: { en: "Step ×20", ko: "20단계" },
    reset: { en: "↻ Reset", ko: "↻ 초기화" },
    dataset: { en: "Dataset", ko: "데이터" },
    dsBlobs: { en: "Two blobs (easy)", ko: "두 무리 (쉬움)" },
    dsCircle: { en: "Circle", ko: "원" },
    dsXor: { en: "XOR", ko: "XOR" },
    dsMoons: { en: "Two moons", ko: "반달 두 개" },
    dsSpiral: { en: "Spiral (hard)", ko: "나선 (어려움)" },
    epoch: { en: "Epoch", ko: "에폭(반복)" },
    loss: { en: "Loss", ko: "손실" },
    acc: { en: "Accuracy", ko: "정확도" },
    g1: { en: "Group 1", ko: "그룹 1" },
    g2: { en: "Group 2", ko: "그룹 2" },
    nStart: { en: "Random start — the boundary is meaningless.", ko: "무작위 시작 — 경계가 아직 의미 없음." },
    nLearn: { en: "Learning… the boundary is bending toward the data.", ko: "학습 중… 경계가 데이터에 맞춰 휘어집니다." },
    nAlmost: { en: "Almost there — most dots are on the right side now.", ko: "거의 다 됨 — 대부분의 점이 올바른 쪽에 있습니다." },
    nDone: { en: "Converged! The network has separated the two groups.", ko: "수렴 완료! 신경망이 두 그룹을 구분했습니다." },
    xorHint: {
      en: "Tip: switch to XOR — a straight line can never separate it, so the network must learn a curved boundary. That curve is what the hidden layer buys you.",
      ko: "팁: XOR로 바꿔 보세요 — 직선으로는 절대 못 나눕니다. 그래서 신경망은 곡선 경계를 배워야 합니다. 그 곡선이 바로 은닉층이 주는 능력입니다.",
    },
  },

  bp: {
    eyebrow: { en: "WATCH ONE TRAINING STEP", ko: "학습 한 단계 들여다보기" },
    title: { en: "Forward pass → backprop → weight update", ko: "순전파 → 역전파 → 가중치 갱신" },
    intro: {
      en: "Above you watched the boundary move. But HOW does a weight know which way to turn? Here is a tiny real network (2 inputs → 2 hidden → 1 output). Step through one full training iteration and watch the exact value of every weight change.",
      ko: "위에서는 경계가 움직이는 것을 봤습니다. 그런데 가중치는 어느 방향으로 돌아야 할지 어떻게 알까요? 여기 아주 작은 실제 신경망(입력 2 → 은닉 2 → 출력 1)이 있습니다. 한 번의 학습 단계를 한 단계씩 진행하며 모든 가중치 값이 바뀌는 과정을 직접 보세요.",
    },
    next: { en: "Next step ▶", ko: "다음 단계 ▶" },
    play: { en: "▶ Auto", ko: "▶ 자동" },
    pause: { en: "⏸ Pause", ko: "⏸ 정지" },
    runMin: { en: "⏩ Repeat to min loss", ko: "⏩ 최소 손실까지 반복" },
    stopRun: { en: "⏸ Stop", ko: "⏸ 멈춤" },
    racing: { en: "Repeating the full cycle — forward → loss → backprop → update — again and again. Watch the loss curve fall toward its minimum.", ko: "전체 사이클(순전파 → 손실 → 역전파 → 갱신)을 계속 반복합니다. 손실 곡선이 최솟값으로 떨어지는 것을 지켜보세요." },
    converged: { en: "Converged — the loss has bottomed out and the prediction ŷ now matches the target. The network has learned this example.", ko: "수렴 완료 — 손실이 바닥에 닿았고 예측 ŷ가 정답과 일치합니다. 신경망이 이 예시를 학습했습니다." },
    lossCurve: { en: "Loss per iteration", ko: "반복마다의 손실" },
    reset: { en: "↻ Reset", ko: "↻ 초기화" },
    iter: { en: "Iteration", ko: "반복" },
    example: { en: "Example", ko: "예시" },
    target: { en: "Target", ko: "정답" },
    pred: { en: "Prediction ŷ", ko: "예측 ŷ" },
    loss: { en: "Loss", ko: "손실" },
    phase: { en: "Phase", ko: "단계" },
    calc: { en: "This neuron's calculation", ko: "이 뉴런의 계산" },
    p0: { en: "Setup", ko: "준비" },
    p1: { en: "1 · Forward → h₀", ko: "1 · 순전파 → h₀" },
    p2: { en: "1 · Forward → h₁", ko: "1 · 순전파 → h₁" },
    p3: { en: "1 · Forward → output ŷ", ko: "1 · 순전파 → 출력 ŷ" },
    p4: { en: "2 · Compute loss", ko: "2 · 손실 계산" },
    p5: { en: "3 · Backpropagation", ko: "3 · 역전파" },
    p6: { en: "4 · Update weights", ko: "4 · 가중치 갱신" },
    n0: { en: "A training example enters. The weights still hold their current values. We will compute the network ONE neuron at a time.", ko: "학습 예시가 들어옵니다. 가중치는 현재 값을 그대로 유지합니다. 신경망을 한 뉴런씩 차례로 계산하겠습니다." },
    n1: { en: "First hidden neuron h₀. Take each input × the weight on its arrow, add them up, add the bias, then squash with σ. Only the two arrows feeding h₀ are lit.", ko: "첫 번째 은닉 뉴런 h₀. 각 입력 × 화살표의 가중치를 모두 더하고, 편향을 더한 뒤, σ로 누릅니다. h₀로 들어가는 두 화살표만 켜집니다." },
    n2: { en: "Now the second hidden neuron h₁ — exactly the same recipe, but with its own arrows and bias. h₀ is already done.", ko: "이제 두 번째 은닉 뉴런 h₁ — 똑같은 방식이지만 자신만의 화살표와 편향을 씁니다. h₀는 이미 끝났습니다." },
    n3: { en: "Finally the output ŷ. Combine the two hidden values h₀, h₁ with their weights, add the bias, squash with σ. That number is the prediction.", ko: "마지막으로 출력 ŷ. 두 은닉값 h₀, h₁을 가중치와 결합하고 편향을 더해 σ로 누릅니다. 그 숫자가 예측입니다." },
    n4: { en: "How wrong is it? Loss = ½(ŷ − target)². The bigger the gap, the bigger the loss.", ko: "얼마나 틀렸나? 손실 = ½(ŷ − 정답)². 차이가 클수록 손실이 큽니다." },
    n5: { en: "Backpropagation: the error flows backward, and the chain rule gives each weight a gradient — how much it pushed the output wrong.", ko: "역전파: 오차가 뒤로 흐르고, 연쇄법칙으로 각 가중치의 기울기(출력을 얼마나 틀리게 했는지)를 구합니다." },
    n6: { en: "Update: every weight steps a little against its gradient: w ← w − lr·∇. Green = it just changed. Next time the loss will be a touch lower.", ko: "갱신: 모든 가중치가 기울기 반대로 조금 이동: w ← w − lr·∇. 초록 = 방금 변경됨. 다음엔 손실이 조금 더 낮아집니다." },
    colWeight: { en: "weight", ko: "가중치" },
    colValue: { en: "value", ko: "값" },
    colGrad: { en: "gradient ∇", ko: "기울기 ∇" },
    colNew: { en: "new value", ko: "새 값" },
    lr: { en: "learning rate", ko: "학습률" },
  },

  mlm: {
    eyebrow: { en: "HOW THE ENCODER TRAINS", ko: "인코더는 이렇게 학습한다" },
    title: { en: "Masked Language Modeling — fill in the blank", ko: "마스크 언어 모델링 — 빈칸 채우기" },
    intro: {
      en: "Once the tokenizer above has split text into pieces, the encoder learns what those pieces MEAN. This is how modern text encoders (BERT, RoBERTa, XLM-R) actually learn — with no human labels. Hide a word with [MASK] and the model must predict it from context. Repeat over billions of sentences and it absorbs grammar, facts, and meaning. Below is a REAL multilingual BERT predicting live in your browser.",
      ko: "위 토크나이저가 텍스트를 조각으로 나눈 뒤, 인코더는 그 조각들이 무엇을 의미하는지 학습합니다. 최신 텍스트 인코더(BERT, RoBERTa, XLM-R)가 실제로 학습하는 방식 — 사람이 만든 라벨 없이. 단어를 [MASK]로 가리면 모델이 문맥으로 그 단어를 예측해야 합니다. 수십억 문장에 반복하면 문법·사실·의미를 흡수합니다. 아래는 브라우저에서 실시간으로 예측하는 진짜 다국어 BERT입니다.",
    },
    loadBtn: { en: "▶ Load the real BERT (downloads weights once)", ko: "▶ 진짜 BERT 불러오기 (가중치 최초 1회 다운로드)" },
    loading: { en: "Downloading the real BERT weights… (loads automatically — a moment)", ko: "진짜 BERT 가중치 내려받는 중… (자동 로드 — 잠시만요)" },
    error: { en: "Couldn't load (needs internet & some memory). The rest of the page still works.", ko: "불러오기 실패(인터넷·메모리 필요). 나머지 페이지는 정상 동작합니다." },
    retry: { en: "Retry", ko: "다시 시도" },
    editLabel: { en: "Edit the words around the locked [MASK] — predictions update live", ko: "고정된 [MASK] 주변 단어를 편집하세요 — 예측이 실시간 갱신됩니다" },
    beforePh: { en: "words before…", ko: "앞 단어…" },
    afterPh: { en: "…words after", ko: "…뒤 단어" },
    lockedNote: { en: "The [MASK] stays put. Change the words BEFORE or AFTER it and watch the percentages shift — BERT reads both sides of the blank (unlike left-to-right next-word models).", ko: "[MASK]는 고정입니다. 앞이나 뒤 단어를 바꾸면 퍼센트가 달라지는 것을 보세요 — BERT는 빈칸의 양쪽 문맥을 모두 읽습니다(왼→오 다음단어 모델과 다름)." },
    predicting: { en: "thinking…", ko: "생각 중…" },
    preset_en: { en: "English example", ko: "영어 예시" },
    preset_kr: { en: "Korean example", ko: "한국어 예시" },
    preset_after: { en: "After-context example", ko: "뒤 문맥 예시" },
    tokenized: { en: "Your sentence as tokens (what you learned earlier)", ko: "토큰으로 본 문장 (앞에서 배운 내용)" },
    tokenizedNote: { en: "Before BERT can think, the tokenizer splits your sentence into these pieces — including the [MASK] as its own special token.", ko: "BERT가 생각하기 전에, 토크나이저가 문장을 이 조각들로 나눕니다 — [MASK]도 하나의 특수 토큰입니다." },
    results: { en: "BERT's top guesses", ko: "BERT의 상위 예측" },
    note: {
      en: "Nobody labeled these answers — the sentence is its own answer key. That's “self-supervised” learning, and it's why encoders can train on the whole internet without armies of annotators.",
      ko: "이 정답을 라벨링한 사람은 없습니다 — 문장 자체가 정답지입니다. 이것이 ‘자기지도(self-supervised)’ 학습이며, 인코더가 수많은 주석자 없이도 인터넷 전체로 학습할 수 있는 이유입니다.",
    },
  },

  emb: {
    eyebrow: { en: "FROM PICTURES TO WORDS", ko: "그림에서 언어로" },
    title: { en: "Turning words into numbers (embeddings)", ko: "단어를 숫자로 (임베딩)" },
    intro: {
      en: "Networks only understand numbers, so each word becomes a list of numbers — a vector. Through training, the network learns to place words with similar meaning near each other. Click a word to see its nearest neighbors.",
      ko: "신경망은 숫자만 이해하므로, 각 단어는 숫자 목록 — 벡터가 됩니다. 학습을 통해 신경망은 의미가 비슷한 단어를 서로 가까이 놓는 법을 배웁니다. 단어를 클릭해 가장 가까운 이웃을 보세요.",
    },
    neighbors: { en: "Closest in meaning", ko: "의미가 가장 가까운 단어" },
    note: {
      en: "This is a simplified 2-D map; real embeddings have hundreds of dimensions. Notice meanings cluster — and across languages too.",
      ko: "이것은 단순화한 2차원 지도입니다; 실제 임베딩은 수백 차원입니다. 의미끼리 뭉치는 것을 보세요 — 언어를 넘어서도요.",
    },
  },

  emb3d: {
    title: { en: "Now in 3D — add your own words", ko: "이제 3D로 — 직접 단어를 추가하기" },
    intro: {
      en: "Same idea, but live and in 3D with a REAL model. It turns each word into a 384-number vector; we project that to 3D so you can see it. Drag to rotate, use +/− to zoom, click a word for its closest relatives. Add any word — even Korean — and watch where it lands.",
      ko: "같은 개념을 실제 모델로 실시간 3D에서. 모델이 각 단어를 384개 숫자의 벡터로 바꾸고, 이를 3D로 투영해 보여줍니다. 드래그로 회전, +/−로 확대/축소, 단어 클릭 시 가장 가까운 단어 표시. 아무 단어나(한국어도) 추가해 어디에 놓이는지 보세요.",
    },
    loadBtn: { en: "▶ Load the 3D word-vector explorer (downloads model once)", ko: "▶ 3D 단어 벡터 탐색기 불러오기 (모델 최초 1회 다운로드)" },
    loading: { en: "Downloading the embedding model (~23 MB, once) & embedding words…", ko: "임베딩 모델 내려받는 중 (~23MB, 최초 1회) & 단어 임베딩 중…" },
    error: { en: "Couldn't load (needs internet). The 2-D map above still works.", ko: "불러오기 실패(인터넷 필요). 위 2D 지도는 정상 동작합니다." },
    retry: { en: "Retry", ko: "다시 시도" },
    addPlaceholder: { en: "Add a word (any language)…", ko: "단어 추가 (아무 언어)…" },
    addBtn: { en: "+ Add", ko: "+ 추가" },
    neighbors: { en: "Closest by real cosine similarity", ko: "실제 코사인 유사도로 가장 가까운 단어" },
    dragHint: { en: "Drag to rotate (stops the spin) · +/− to zoom · click a word · gold lines = country↔capital", ko: "드래그=회전(자동회전 멈춤) · +/−=확대 · 단어 클릭 · 금색 선=나라↔수도" },
    busy: { en: "embedding…", ko: "임베딩 중…" },
    spinOn: { en: "⟳ Spinning", ko: "⟳ 회전 중" },
    spinOff: { en: "⟳ Spin", ko: "⟳ 회전" },
    relTitle: { en: "The “capital of” relationship (real similarity)", ko: "“수도” 관계 (실제 유사도)" },
    relNote: { en: "Korea↔Seoul, Japan↔Tokyo, France↔Paris score about the SAME — every country sits a similar step from its capital. The relationship is a consistent direction in this space, which is exactly what lets embeddings do analogies.", ko: "한국↔서울, 일본↔도쿄, 프랑스↔파리의 점수가 거의 같습니다 — 모든 나라가 수도와 비슷한 거리에 있습니다. 이 관계는 공간 안에서 일관된 방향이며, 임베딩이 유추(analogy)를 할 수 있는 이유입니다." },
  },

  emblearn: {
    eyebrow: { en: "HOW A TOKEN GETS ITS VECTOR", ko: "토큰은 어떻게 벡터를 얻나" },
    title: { en: "Learning an embedding from scratch", ko: "임베딩을 처음부터 학습하기" },
    intro: {
      en: "A network can't read letters — only numbers. So every token is handed a short list of numbers called its embedding (here just 2 numbers, so we can plot it). At the start these numbers are RANDOM. Watch the network learn better ones, live.",
      ko: "신경망은 글자를 읽지 못하고 숫자만 압니다. 그래서 모든 토큰에는 임베딩이라는 짧은 숫자 목록이 주어집니다(여기선 2개라 그래프로 그릴 수 있어요). 처음엔 이 숫자가 무작위입니다. 신경망이 더 나은 값을 학습하는 과정을 실시간으로 보세요.",
    },
    how: {
      en: "The rule it learns by: tokens that appear together in the text get PULLED closer; random unrelated tokens get PUSHED apart. Repeat over the whole corpus and every token drifts to a spot that reflects its meaning. (This is the idea behind word2vec.)",
      ko: "학습 규칙: 글에서 함께 등장하는 토큰은 서로 가까이 당겨지고, 무관한 무작위 토큰은 서로 밀어냅니다. 말뭉치 전체에 반복하면 각 토큰이 의미를 반영하는 위치로 이동합니다. (word2vec의 핵심 아이디어입니다.)",
    },
    lookup: { en: "Token → ID → vector (a row in the embedding table)", ko: "토큰 → ID → 벡터 (임베딩 표의 한 행)" },
    id: { en: "id", ko: "ID" },
    vector: { en: "vector", ko: "벡터" },
    lookupNote: { en: "Click any dot or row to inspect its vector. Each token is just a row number into a big table of learnable numbers.", ko: "점이나 행을 클릭해 벡터를 살펴보세요. 각 토큰은 학습 가능한 숫자들의 큰 표에서 행 번호일 뿐입니다." },
    play: { en: "▶ Train", ko: "▶ 학습" },
    pause: { en: "⏸ Pause", ko: "⏸ 정지" },
    onePair: { en: "One step ▶ (show the math)", ko: "한 단계 ▶ (계산 보기)" },
    step: { en: "Train 15 steps", ko: "15단계 학습" },
    reset: { en: "↻ Reset (re-randomize)", ko: "↻ 초기화 (무작위로)" },
    epoch: { en: "epoch", ko: "에폭" },
    dist: { en: "model error (loss):", ko: "모델 오차(손실):" },
    plotTitle: { en: "Each token's 2-number vector, plotted", ko: "각 토큰의 2-숫자 벡터를 그린 그래프" },
    plotNote: { en: "Colors mark the hidden topics — the model is never told them; clusters EMERGE from training alone.", ko: "색은 숨은 주제를 표시합니다 — 모델은 주제를 모릅니다. 군집은 오직 학습에서 저절로 생깁니다." },
    legendPull: { en: "predicted too far → pull together", ko: "너무 멀다고 예측 → 당김" },
    legendPush: { en: "predicted too close → push apart", ko: "너무 가깝다고 예측 → 밀어냄" },
    tableTitle: { en: "The embedding table (updates as it learns)", ko: "임베딩 표 (학습하며 갱신됨)" },
    closest: { en: "closest tokens now", ko: "지금 가장 가까운 토큰" },
    stepTitle: { en: "This training step — predict → error → update", ko: "이 학습 단계 — 예측 → 오차 → 갱신" },
    stepTask: { en: "The model GUESSES how related each pair is (from how close their vectors are). It compares to the truth, and the error decides how far to move them. Same predict→error→update loop as the backprop section.", ko: "모델은 각 쌍이 얼마나 관련 있는지(벡터가 얼마나 가까운지로) 추측합니다. 정답과 비교하고, 오차가 얼마나 움직일지 정합니다. 역전파 섹션과 같은 예측→오차→갱신 루프입니다." },
    thPair: { en: "token pair", ko: "토큰 쌍" },
    thTruth: { en: "truth", ko: "정답" },
    thPred: { en: "model's guess", ko: "모델 예측" },
    thErr: { en: "error", ko: "오차" },
    thAction: { en: "update", ko: "갱신" },
    pull: { en: "pull", ko: "당김" },
    push: { en: "push", ko: "밀어냄" },
    encoderBridge: { en: "This IS how an encoder begins: its first layer is exactly this embedding table, learned the same way. A real encoder like BERT then keeps reshaping these vectors with the masking task you saw in the Encoder section — so context, not just co-occurrence, refines each token's meaning.", ko: "인코더도 바로 이렇게 시작합니다: 첫 층이 정확히 이 임베딩 표이며 같은 방식으로 학습됩니다. BERT 같은 실제 인코더는 그다음, 인코더 섹션에서 본 마스킹 과제로 이 벡터들을 계속 다듬어 — 단순 동시출현이 아니라 문맥이 각 토큰의 의미를 정교화합니다." },
    nStart: { en: "Everything starts as a random cloud — these numbers mean nothing yet. Press One step to see the math, or Train to run.", ko: "모든 것이 무작위 구름에서 시작합니다 — 아직 숫자는 의미가 없습니다. '한 단계'로 계산을 보거나 '학습'으로 실행하세요." },
    nLearn: { en: "Learning… each step the model predicts relatedness, measures its error, and nudges vectors to fix it. The loss is falling.", ko: "학습 중… 매 단계 모델이 관련도를 예측하고 오차를 재서 벡터를 조정합니다. 손실이 줄고 있습니다." },
    nDone: { en: "Settled — the loss is low. Tokens with similar meaning now sit together; that grouping IS the learned embedding. The 2-D and 3-D maps below show this with a real model.", ko: "안정됨 — 손실이 낮습니다. 의미가 비슷한 토큰이 모여 있고, 이 군집이 바로 학습된 임베딩입니다. 아래 2D·3D 지도는 실제 모델로 이것을 보여줍니다." },
  },

  groups: {
    foundations: {
      title: { en: "Foundations — how a network learns", ko: "기초 — 신경망은 어떻게 학습하나" },
      sub: { en: "A neuron, training a classifier, and one full backprop step.", ko: "뉴런, 분류기 학습, 그리고 역전파 한 단계." },
    },
    tokenizer: {
      title: { en: "Tokenizer — text into pieces", ko: "토크나이저 — 텍스트를 조각으로" },
      sub: { en: "First, text is split into subword tokens. The tokenizer is trained too.", ko: "먼저 텍스트를 서브워드 토큰으로 나눕니다. 토크나이저도 학습됩니다." },
    },
    encoder: {
      title: { en: "Encoder — learning meaning", ko: "인코더 — 의미 학습하기" },
      sub: { en: "A real BERT learns by filling in masked blanks (self-supervised).", ko: "실제 BERT가 가려진 빈칸을 채우며 학습합니다(자기지도)." },
    },
    embeddings: {
      title: { en: "Embeddings — tokens as vectors", ko: "임베딩 — 토큰을 벡터로" },
      sub: { en: "How a token gets its vector, then real word maps in 2-D and 3-D.", ko: "토큰이 벡터를 얻는 방법, 그리고 실제 단어 지도(2D·3D)." },
    },
    tokenization: {
      title: { en: "Tokenization & the token tax", ko: "토큰화와 토큰세" },
      sub: { en: "Why Korean and low-resource languages cost more tokens.", ko: "한국어·저자원 언어가 토큰을 더 많이 쓰는 이유." },
    },
    reference: {
      title: { en: "Reference", ko: "참고 자료" },
      sub: { en: "Vocabulary card for the key terms.", ko: "핵심 용어 카드." },
    },
  },

  bpetrain: {
    eyebrow: { en: "HOW A TOKENIZER LEARNS", ko: "토크나이저는 어떻게 학습하나" },
    title: { en: "Training a tokenizer (BPE)", ko: "토크나이저 학습하기 (BPE)" },
    intro: {
      en: "A subword tokenizer is also trained — but differently from the network above. It starts from single characters, then repeatedly glues together the most frequent neighboring pair. Press Step (or Play) to watch it build a vocabulary of reusable pieces from this little corpus.",
      ko: "서브워드 토크나이저도 학습됩니다 — 다만 위 신경망과는 다른 방식입니다. 글자 하나하나에서 시작해, 가장 자주 붙어 나오는 이웃 쌍을 반복해서 합칩니다. 단계(또는 재생)를 눌러 작은 말뭉치에서 재사용 가능한 조각들의 어휘집이 만들어지는 과정을 보세요.",
    },
    play: { en: "▶ Play", ko: "▶ 재생" },
    pause: { en: "⏸ Pause", ko: "⏸ 일시정지" },
    step: { en: "Merge once", ko: "한 번 병합" },
    reset: { en: "↻ Reset", ko: "↻ 초기화" },
    trainingSet: { en: "Training set", ko: "학습 세트" },
    corpus: { en: "Training corpus (word × frequency)", ko: "학습 말뭉치 (단어 × 빈도)" },
    merges: { en: "Merges learned (in order)", ko: "학습한 병합 규칙 (순서대로)" },
    vocab: { en: "Vocabulary size", ko: "어휘집 크기" },
    budget: { en: "Merge budget", ko: "병합 예산" },
    mergePre: { en: "Merge", ko: "병합" },
    appeared: { en: "appeared", ko: "등장" },
    times: { en: "×", ko: "회" },
    done: { en: "Budget reached — training stops here (a real BPE setting). Notice the words are now reusable PIECES — low, est, er, wid — shared across many words, not whole memorized words. Keep merging and it would just glue each word into a single token.", ko: "예산 도달 — 여기서 학습을 멈춥니다 (실제 BPE 설정). 이제 단어들이 재사용 가능한 조각 — low, est, er, wid — 으로 나뉘어 여러 단어에 공유되는 것을 보세요. 통째로 외운 단어가 아닙니다. 계속 병합하면 각 단어가 하나의 토큰으로 붙어버립니다." },
    start: { en: "Every word starts as individual characters. Press Step.", ko: "모든 단어는 글자 하나하나로 시작합니다. 단계를 누르세요." },
    tryLabel: { en: "Now tokenize a NEW word with what it learned:", ko: "이제 학습한 규칙으로 새 단어를 토큰화해 보세요:" },
    pieces: { en: "pieces", ko: "조각" },
    tryHint: {
      en: "Try “slowest” — built cleanly from learned pieces. Then type a Korean word: it was never in training, so it falls back to tiny character pieces. That is exactly why low-resource languages pay the token tax.",
      ko: "“slowest”를 보세요 — 학습한 조각들로 깔끔하게 만들어집니다. 이제 한국어 단어를 입력해 보세요: 학습에 없었기 때문에 작은 글자 조각으로 떨어집니다. 저자원 언어가 토큰세를 내는 이유가 바로 이것입니다.",
    },
  },

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
