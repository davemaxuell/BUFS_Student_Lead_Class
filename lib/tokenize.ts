import { encode, decode } from "gpt-tokenizer";

export type SubToken = { id: number; text: string; broken: boolean };

/**
 * Character tokenization.
 * Uses Intl.Segmenter (grapheme) so a decomposed Hangul syllable or an emoji
 * counts as ONE visible character, falling back to code-point splitting.
 */
export function charTokens(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => (s as { segment: string }).segment);
  }
  return Array.from(text);
}

/**
 * Naive "word" tokenization: runs of letters/numbers are one token, and each
 * punctuation mark is its own token. Demonstrates how Korean eojeol such as
 * "학교에서" collapse into a single (and ever-multiplying) vocabulary entry.
 */
export function wordTokens(text: string): string[] {
  const matches = text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu);
  return matches ?? [];
}

/**
 * Subword tokenization using GPT's real byte-pair encoding (cl100k_base).
 * Each token id is decoded individually so we can show the piece; tokens that
 * are only a partial byte sequence (common for Korean) decode to a replacement
 * character and are flagged `broken`.
 */
export function subwordTokens(text: string): SubToken[] {
  const ids = encode(text);
  return ids.map((id) => {
    let str = "";
    let broken = false;
    try {
      str = decode([id]);
    } catch {
      broken = true;
    }
    if (str.includes("�")) broken = true;
    return { id, text: str, broken };
  });
}

/** Just the subword token count — for the token-tax comparisons. */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

/** Count visible characters (graphemes). */
export function countChars(text: string): number {
  if (!text) return 0;
  return charTokens(text).length;
}

/** Make whitespace visible inside a chip. */
export function showWhitespace(s: string): string {
  return s.replace(/ /g, "␣").replace(/\n/g, "⏎").replace(/\t/g, "⇥");
}
