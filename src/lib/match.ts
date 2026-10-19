import { toKeystrokes } from "./hangul";

export type MatchStatus = "empty" | "partial" | "wrong" | "correct";

export interface KoreanMatch {
  status: MatchStatus;
  /** Target keystrokes (jamo). */
  target: string[];
  /** How many of the target keystrokes have been typed correctly so far. */
  correctCount: number;
}

export interface EnglishMatch {
  status: MatchStatus;
}

function commonPrefixLength(a: string[], b: string[]): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Drops punctuation and collapses whitespace; leading space is ignored. */
function normalizeKorean(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart();
}

/**
 * Compares typed Korean against the target one key press at a time, so a
 * half-composed syllable (e.g. "갇" on the way to "가다") counts as on track.
 */
export function checkKorean(target: string, input: string): KoreanMatch {
  const targetKeys = toKeystrokes(normalizeKorean(target).trimEnd());
  const inputKeys = toKeystrokes(normalizeKorean(input));
  const correctCount = commonPrefixLength(targetKeys, inputKeys);

  let status: MatchStatus;
  if (inputKeys.length === 0) status = "empty";
  else if (inputKeys.join("").trimEnd() === targetKeys.join("")) status = "correct";
  else if (correctCount === inputKeys.length) status = "partial";
  else status = "wrong";

  return { status, target: targetKeys, correctCount: Math.min(correctCount, targetKeys.length) };
}

function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    // Apostrophes are optional ("im" = "i'm"), including phones' curly ones.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trimStart();
}

/** Accepts any listed meaning, case-insensitive, with an optional leading "to ". */
export function checkEnglish(meanings: string[], input: string): EnglishMatch {
  const typed = normalizeEnglish(input);
  if (!typed) return { status: "empty" };

  const candidates = meanings
    .map((m) => normalizeEnglish(m).trim())
    .flatMap((m) => [m, `to ${m}`]);

  if (candidates.includes(typed.trimEnd())) return { status: "correct" };
  if (candidates.some((c) => c.startsWith(typed))) return { status: "partial" };
  return { status: "wrong" };
}
