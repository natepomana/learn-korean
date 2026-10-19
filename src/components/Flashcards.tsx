import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../lib/decks";
import { useStoredState } from "../lib/useStoredState";
import { useStudySession } from "../lib/useStudySession";
import { Segmented, SessionLayout, SessionSummary, SpeakButton } from "./SessionLayout";

type Side = "korean" | "english";

export function Flashcards({ cards }: { cards: Card[] }) {
  const session = useStudySession(cards);
  const [front, setFront] = useStoredState<Side>("flashcards.front", "korean");
  const [flipped, setFlipped] = useState(false);
  // Changes every time a card is shown, so the card remounts unflipped
  // instead of animating back over the next word.
  const [turn, setTurn] = useState(0);

  const answer = useCallback(
    (correct: boolean) => {
      session.answer(correct);
      setFlipped(false);
      setTurn((t) => t + 1);
    },
    [session.answer],
  );

  useEffect(() => {
    if (session.finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (e.key === "ArrowLeft" || e.key === "1")) {
        answer(false);
      } else if (flipped && (e.key === "ArrowRight" || e.key === "2")) {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, answer, session.finished]);

  // Swipe left/right on a flipped card to answer.
  const swipeStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => (swipeStart.current = e.clientX);
  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (start === null) return;
    const dx = e.clientX - start;
    if (flipped && Math.abs(dx) > 60) answer(dx > 0);
    else if (Math.abs(dx) < 10) setFlipped((f) => !f);
  };

  const card = session.card;

  return (
    <SessionLayout
      title="Flashcards"
      done={session.done}
      total={session.total}
      actions={
        <Segmented
          label="Show first"
          value={front}
          onChange={(side) => {
            setFront(side);
            setFlipped(false);
          }}
          options={[
            { value: "korean", label: "Korean first" },
            { value: "english", label: "English first" },
          ]}
        />
      }
    >
      {session.finished || !card ? (
        <SessionSummary
          total={session.total}
          firstTryCount={session.firstTryCount}
          missed={session.missed}
          onRestart={(subset) => {
            session.restart(subset);
            setFlipped(false);
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="w-full max-w-md perspective-distant">
            <div
              key={turn}
              role="button"
              tabIndex={0}
              aria-label={flipped ? "Card back. Tap to flip" : "Card front. Tap to flip"}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              className={`relative aspect-[4/3] w-full cursor-pointer touch-pan-y select-none transform-3d transition-transform duration-500 ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              <CardFace side={front} card={card} />
              <CardFace side={front === "korean" ? "english" : "korean"} card={card} back />
            </div>
          </div>

          {flipped ? (
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => answer(false)}
                className="rounded-xl border-2 border-rose-300 px-4 py-3 font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
              >
                ← Again
              </button>
              <button
                type="button"
                onClick={() => answer(true)}
                className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-600"
              >
                Got it →
              </button>
            </div>
          ) : (
            <p className="h-[52px] text-sm text-slate-500 dark:text-slate-400">
              Tap the card <span className="hidden sm:inline">or press Space</span> to flip
            </p>
          )}
        </div>
      )}
    </SessionLayout>
  );
}

function CardFace({ side, card, back = false }: { side: Side; card: Card; back?: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-lg backface-hidden dark:border-slate-800 dark:bg-slate-900 ${
        back ? "rotate-y-180" : ""
      }`}
    >
      {side === "korean" ? (
        <>
          <div className="text-5xl font-bold break-keep sm:text-6xl">{card.korean}</div>
          <SpeakButton text={card.korean} />
        </>
      ) : (
        <div className="text-3xl font-semibold sm:text-4xl">{card.english.join(" · ")}</div>
      )}
    </div>
  );
}
