// Lightweight English<->Korean translation for the token-tax puzzle.
// Uses Google's free public translate endpoint (no API key, no model download,
// CORS-enabled). Powers the live auto-fill between the two text boxes. Needs a
// live internet connection; the curated presets work fully offline.

// m2m100 codes / Google codes are both 2-letter here ("en", "ko").
export async function translate(text: string, src: string, tgt: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx" +
    `&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate http ${res.status}`);
  const data = await res.json();
  // data[0] is an array of [translatedChunk, originalChunk, ...] segments.
  const segments: unknown[] = Array.isArray(data?.[0]) ? data[0] : [];
  const out = segments
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("");
  return out.trim();
}
