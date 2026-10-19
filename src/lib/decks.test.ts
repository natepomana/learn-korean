import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
import { DUBEOLSIK, toKeystrokes } from "./hangul";

describe("decks", () => {
  it.each(DECKS.map((deck) => [deck.title, deck] as const))("%s has typeable cards", (_, deck) => {
    expect(deck.cards.length).toBeGreaterThan(0);
    for (const card of deck.cards) {
      expect(card.english.length, card.korean).toBeGreaterThan(0);
      // Every key press must exist on the 두벌식 layout so key hints work.
      const untypeable = toKeystrokes(card.korean).filter((k) => k !== " " && !DUBEOLSIK[k]);
      expect(untypeable, card.korean).toEqual([]);
    }
  });
});
