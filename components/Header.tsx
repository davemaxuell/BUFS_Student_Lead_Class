"use client";

import { S, useLang } from "@/lib/i18n";

export default function Header() {
  const { lang, setLang } = useLang();
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          🧩 {S.meta.title[lang]} <span>· {lang === "en" ? "EN" : "KR"}</span>
        </div>
        <nav className="nav">
          <a href="#nnb">{S.nav.learn[lang]}</a>
          <a href="#bpe">{S.nav.bpe[lang]}</a>
          <a href="#puzzle">{S.nav.puzzle[lang]}</a>
          <a href="#tokenize">{S.nav.tokenize[lang]}</a>
          <a href="#normalize">{S.nav.normalize[lang]}</a>
          <a href="#tax">{S.nav.tax[lang]}</a>
          <a href="#glossary">{S.nav.glossary[lang]}</a>
        </nav>
        <button
          className="lang-btn"
          onClick={() => setLang(lang === "en" ? "ko" : "en")}
          aria-label="Toggle language"
        >
          🌐 {S.langToggle[lang]}
        </button>
      </div>
    </header>
  );
}
