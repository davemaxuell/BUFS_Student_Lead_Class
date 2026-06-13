"use client";

import { S, GLOSSARY, useLang } from "@/lib/i18n";

export default function Glossary() {
  const { lang } = useLang();
  const g = S.glossary;
  return (
    <section id="glossary">
      <div className="container">
        <div className="eyebrow">{g.eyebrow[lang]}</div>
        <h2>{g.title[lang]}</h2>
        <table>
          <thead>
            <tr>
              <th>{g.term[lang]}</th>
              <th>{g.kterm[lang]}</th>
              <th>{g.plain[lang]}</th>
            </tr>
          </thead>
          <tbody>
            {GLOSSARY.map((row) => (
              <tr key={row.term}>
                <td>{row.term}</td>
                <td>{row.kterm}</td>
                <td className="desc">{row.plain[lang]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
