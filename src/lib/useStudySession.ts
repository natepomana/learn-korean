import { useCallback, useState } from "react";
import { shuffle, type Card } from "./decks";

interface SessionState {
  queue: Card[];
  total: number;
  /** Cards answered correctly the first time they came up. */
  firstTry: Set<string>;
  /** Cards missed at least once this round. */
  missed: Map<string, Card>;
}

function start(cards: Card[]): SessionState {
  return { queue: shuffle(cards), total: cards.length, firstTry: new Set(), missed: new Map() };
}

/**
 * A shuffled pass through the cards. Missed cards come back a few cards later
 * until you get them, all in memory — nothing is saved between visits.
 */
export function useStudySession(cards: Card[]) {
  const [state, setState] = useState(() => start(cards));

  const answer = useCallback((correct: boolean) => {
    setState((s) => {
      const [card, ...rest] = s.queue;
      if (!card) return s;
      if (correct) {
        const firstTry = new Set(s.firstTry);
        if (!s.missed.has(card.id)) firstTry.add(card.id);
        return { ...s, queue: rest, firstTry };
      }
      const missed = new Map(s.missed).set(card.id, card);
      // Bring it back after a few other cards (or at the end if few are left).
      const at = Math.min(rest.length, 3 + Math.floor(Math.random() * 3));
      return { ...s, queue: [...rest.slice(0, at), card, ...rest.slice(at)], missed };
    });
  }, []);

  const restart = useCallback((subset?: Card[]) => setState(start(subset ?? cards)), [cards]);

  const done = state.total - new Set(state.queue.map((c) => c.id)).size;

  return {
    card: state.queue[0] as Card | undefined,
    total: state.total,
    done,
    firstTryCount: state.firstTry.size,
    missed: [...state.missed.values()],
    finished: state.queue.length === 0,
    answer,
    restart,
  };
}
