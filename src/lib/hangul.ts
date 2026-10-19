// Breaks Hangul into the individual jamo you'd type on a standard
// (두벌식 / 2-set) Korean keyboard, so we can compare what someone has typed
// against the target even while the IME is still composing a syllable.

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;

const INITIALS = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const VOWELS = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ",
  "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];
const FINALS = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ",
  "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

// Compound jamo that take two key presses.
const COMPOUNDS: Record<string, string> = {
  "ㅘ": "ㅗㅏ", "ㅙ": "ㅗㅐ", "ㅚ": "ㅗㅣ", "ㅝ": "ㅜㅓ", "ㅞ": "ㅜㅔ", "ㅟ": "ㅜㅣ", "ㅢ": "ㅡㅣ",
  "ㄳ": "ㄱㅅ", "ㄵ": "ㄴㅈ", "ㄶ": "ㄴㅎ", "ㄺ": "ㄹㄱ", "ㄻ": "ㄹㅁ", "ㄼ": "ㄹㅂ",
  "ㄽ": "ㄹㅅ", "ㄾ": "ㄹㅌ", "ㄿ": "ㄹㅍ", "ㅀ": "ㄹㅎ", "ㅄ": "ㅂㅅ",
};

export function isHangulSyllable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code >= SYLLABLE_START && code <= SYLLABLE_END;
}

function splitCompound(jamo: string): string[] {
  return [...(COMPOUNDS[jamo] ?? jamo)];
}

/** The key presses (as jamo) needed to type one character. */
export function charToKeystrokes(char: string): string[] {
  if (!isHangulSyllable(char)) return splitCompound(char);
  const index = char.codePointAt(0)! - SYLLABLE_START;
  const initial = INITIALS[Math.floor(index / (21 * 28))];
  const vowel = VOWELS[Math.floor(index / 28) % 21];
  const final = FINALS[index % 28];
  return [initial, ...splitCompound(vowel), ...(final ? splitCompound(final) : [])];
}

export function toKeystrokes(text: string): string[] {
  return [...text].flatMap(charToKeystrokes);
}

// 두벌식 layout: jamo → physical key on a QWERTY keyboard.
export const DUBEOLSIK: Record<string, { key: string; shift?: boolean }> = {
  "ㅂ": { key: "q" }, "ㅈ": { key: "w" }, "ㄷ": { key: "e" }, "ㄱ": { key: "r" }, "ㅅ": { key: "t" },
  "ㅛ": { key: "y" }, "ㅕ": { key: "u" }, "ㅑ": { key: "i" }, "ㅐ": { key: "o" }, "ㅔ": { key: "p" },
  "ㅁ": { key: "a" }, "ㄴ": { key: "s" }, "ㅇ": { key: "d" }, "ㄹ": { key: "f" }, "ㅎ": { key: "g" },
  "ㅗ": { key: "h" }, "ㅓ": { key: "j" }, "ㅏ": { key: "k" }, "ㅣ": { key: "l" },
  "ㅋ": { key: "z" }, "ㅌ": { key: "x" }, "ㅊ": { key: "c" }, "ㅍ": { key: "v" }, "ㅠ": { key: "b" },
  "ㅜ": { key: "n" }, "ㅡ": { key: "m" },
  "ㅃ": { key: "q", shift: true }, "ㅉ": { key: "w", shift: true }, "ㄸ": { key: "e", shift: true },
  "ㄲ": { key: "r", shift: true }, "ㅆ": { key: "t", shift: true },
  "ㅒ": { key: "o", shift: true }, "ㅖ": { key: "p", shift: true },
};
