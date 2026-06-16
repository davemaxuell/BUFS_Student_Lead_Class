"use client";

import { useEffect, useRef, useState } from "react";
import { S, useLang, type Lang } from "@/lib/i18n";

type NavKey = keyof typeof S.nav;

// Each day collapses to one dropdown of its section links.
// Adding Day 3 later = append another entry here.
const DAYS: { day: keyof typeof S.days; links: { href: string; key: NavKey }[] }[] = [
  {
    day: "d1",
    links: [
      { href: "#nnb", key: "learn" },
      { href: "#bpe", key: "bpe" },
      { href: "#puzzle", key: "puzzle" },
      { href: "#tokenize", key: "tokenize" },
      { href: "#normalize", key: "normalize" },
      { href: "#tax", key: "tax" },
      { href: "#glossary", key: "glossary" },
    ],
  },
  {
    day: "d2",
    links: [
      { href: "#attention", key: "attention" },
      { href: "#transformer", key: "transformer" },
      { href: "#encdec", key: "encdec" },
    ],
  },
];

function DayMenu({
  day,
  links,
  lang,
  open,
  onToggle,
  onClose,
}: {
  day: keyof typeof S.days;
  links: { href: string; key: NavKey }[];
  lang: Lang;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="day-menu">
      <button className="day-menu-btn" onClick={onToggle} aria-expanded={open} aria-haspopup="true">
        {S.days[day].tag[lang]}
        <span className={`day-menu-caret${open ? " open" : ""}`} aria-hidden>▾</span>
      </button>
      {open && (
        <div className="day-menu-panel" role="menu">
          {links.map((l) => (
            <a key={l.href} href={l.href} role="menuitem" onClick={onClose}>
              {S.nav[l.key][lang]}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { lang, setLang } = useLang();
  // Track which day's menu is open (null = all closed); only one open at a time.
  const [openDay, setOpenDay] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openDay) return;
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDay(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenDay(null); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openDay]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          {S.meta.title[lang]} <span>· {lang === "en" ? "EN" : "KR"}</span>
        </div>

        <nav className="nav" ref={navRef}>
          {DAYS.map(({ day, links }) => (
            <DayMenu
              key={day}
              day={day}
              links={links}
              lang={lang}
              open={openDay === day}
              onToggle={() => setOpenDay((d) => (d === day ? null : day))}
              onClose={() => setOpenDay(null)}
            />
          ))}
        </nav>

        <button
          className="lang-btn"
          onClick={() => setLang(lang === "en" ? "ko" : "en")}
          aria-label="Toggle language"
        >
          {S.langToggle[lang]}
        </button>
      </div>
    </header>
  );
}
