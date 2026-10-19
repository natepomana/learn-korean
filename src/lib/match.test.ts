import { describe, expect, it } from "vitest";
import { charToKeystrokes, toKeystrokes } from "./hangul";
import { checkEnglish, checkKorean } from "./match";

describe("toKeystrokes", () => {
  it("splits simple syllables", () => {
    expect(toKeystrokes("가다")).toEqual(["ㄱ", "ㅏ", "ㄷ", "ㅏ"]);
  });

  it("splits compound vowels and final consonants into separate key presses", () => {
    expect(charToKeystrokes("괜")).toEqual(["ㄱ", "ㅗ", "ㅐ", "ㄴ"]);
    expect(charToKeystrokes("닭")).toEqual(["ㄷ", "ㅏ", "ㄹ", "ㄱ"]);
    expect(charToKeystrokes("ㅘ")).toEqual(["ㅗ", "ㅏ"]);
  });

  it("keeps tense consonants as a single (shifted) key", () => {
    expect(charToKeystrokes("까")).toEqual(["ㄲ", "ㅏ"]);
  });

  it("passes non-Hangul through", () => {
    expect(toKeystrokes("a 가")).toEqual(["a", " ", "ㄱ", "ㅏ"]);
  });
});

describe("checkKorean", () => {
  it("is empty with no input", () => {
    expect(checkKorean("가다", "").status).toBe("empty");
  });

  it("treats a half-composed syllable as on track", () => {
    // Typing 가다 on a Korean IME passes through ㄱ → 가 → 갇 → 가다.
    for (const step of ["ㄱ", "가", "갇"]) {
      expect(checkKorean("가다", step).status).toBe("partial");
    }
    expect(checkKorean("가다", "가다").status).toBe("correct");
  });

  it("flags a wrong key and reports how far it got", () => {
    const result = checkKorean("가다", "각");
    expect(result.status).toBe("wrong");
    expect(result.correctCount).toBe(2);
  });

  it("handles compound vowels mid-composition", () => {
    expect(checkKorean("과자", "고").status).toBe("partial");
    expect(checkKorean("과자", "과").status).toBe("partial");
  });

  it("ignores punctuation and extra spaces", () => {
    expect(checkKorean("안녕하세요!", "안녕하세요").status).toBe("correct");
    expect(checkKorean("안녕 하세요", "안녕  하세요 ").status).toBe("correct");
    expect(checkKorean("안녕 하세요", "안녕 ").status).toBe("partial");
  });

  it("rejects typing past the end", () => {
    expect(checkKorean("가다", "가다가").status).toBe("wrong");
  });
});

describe("checkEnglish", () => {
  const meanings = ["look", "see", "watch"];

  it("accepts any meaning, case-insensitively", () => {
    expect(checkEnglish(meanings, "See").status).toBe("correct");
    expect(checkEnglish(meanings, "watch ").status).toBe("correct");
  });

  it("allows a leading 'to'", () => {
    expect(checkEnglish(meanings, "to look").status).toBe("correct");
    expect(checkEnglish(meanings, "to l").status).toBe("partial");
  });

  it("is partial while typing a prefix of any meaning", () => {
    expect(checkEnglish(meanings, "wa").status).toBe("partial");
    expect(checkEnglish(["throw away"], "throw a").status).toBe("partial");
  });

  it("treats apostrophes as optional, straight or curly", () => {
    for (const typed of ["I'm sorry", "im sorry", "I’m sorry"]) {
      expect(checkEnglish(["I'm sorry"], typed).status).toBe("correct");
    }
    expect(checkEnglish(["it's okay"], "it'").status).toBe("partial");
  });

  it("is wrong once the input can't become a meaning", () => {
    expect(checkEnglish(meanings, "wo").status).toBe("wrong");
  });
});
