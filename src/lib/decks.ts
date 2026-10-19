export interface Card {
  id: string;
  korean: string;
  english: string[];
}

export interface Deck {
  id: string;
  title: string;
  cards: Card[];
}

interface DeckFile {
  id: string;
  title: string;
  cards: { korean: string; english: string[] }[];
}

// Every JSON file in src/data is a deck — drop a new one in and it shows up.
const files = import.meta.glob<DeckFile>("../data/*.json", { eager: true, import: "default" });

export const DECKS: Deck[] = Object.values(files)
  .map((deck) => ({
    id: deck.id,
    title: deck.title,
    cards: deck.cards.map((card) => ({ ...card, id: `${deck.id}:${card.korean}` })),
  }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

/** Cards from the chosen decks, with words that appear in several decks merged. */
export function cardsFor(deckIds: string[]): Card[] {
  const byKorean = new Map<string, Card>();
  for (const deck of DECKS) {
    if (!deckIds.includes(deck.id)) continue;
    for (const card of deck.cards) {
      const existing = byKorean.get(card.korean);
      if (!existing) {
        byKorean.set(card.korean, { ...card, english: [...card.english] });
      } else {
        for (const meaning of card.english) {
          if (!existing.english.includes(meaning)) existing.english.push(meaning);
        }
      }
    }
  }
  return [...byKorean.values()];
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
