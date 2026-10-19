import { useEffect, useRef, useState } from "react";
import type { Card } from "../lib/decks";
import { charToKeystrokes } from "../lib/hangul";
import { checkEnglish, checkKorean, type KoreanMatch, type MatchStatus } from "../lib/match";
import { useStoredState } from "../lib/useStoredState";
import { useStudySession } from "../lib/useStudySession";
import { KeyboardHint, type HintTarget } from "./KeyboardHint";
import { Segmented, SessionLayout, SessionSummary, SpeakButton } from "./SessionLayout";

type AnswerIn = "korean" | "english";

const INPUT_STYLES: Record<MatchStatus, string> = {
  empty: "border-slate-300 focus:border-pink-500 dark:border-slate-700",
  partial: "border-sky-400 dark:border-sky-500",
  wrong: "border-rose-500 bg-rose-50 dark:bg-rose-950/40",
  correct: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
};

export function TypingPractice({ cards }: { cards: Card[] }) {
  const session = useStudySession(cards);
  const [answerIn, setAnswerIn] = useStoredState<AnswerIn>("typing.answerIn", "korean");
  const [showKeyboard, setShowKeyboard] = useStoredState(
    "typing.keyboard",
    window.matchMedia("(min-width: 768px)").matches,
  );
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const enterPending = useRef(false);

  const card = session.card;
  const korean = card && answerIn === "korean" ? checkKorean(card.korean, value) : null;
  const status: MatchStatus = !card
    ? "empty"
    : korean
      ? korean.status
      : checkEnglish(card.english, value).status;

  const reset = () => {
    setValue("");
    setRevealed(false);
    inputRef.current?.focus();
  };

  // Reads the input directly so it sees the value the IME just committed.
  const submit = () => {
    if (!card) return;
    const typed = inputRef.current?.value ?? "";
    const result =
      answerIn === "korean" ? checkKorean(card.korean, typed).status : checkEnglish(card.english, typed).status;
    if (revealed) {
      session.answer(false);
      reset();
    } else if (result === "correct") {
      session.answer(true);
      reset();
    } else {
      setShaking(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // With a Korean IME, Enter first commits the syllable being composed.
    // Wait for that before checking, or the last syllable gets lost.
    if (composing.current || e.nativeEvent.isComposing) {
      enterPending.current = true;
      return;
    }
    setTimeout(submit, 0);
  };

  const onCompositionEnd = () => {
    composing.current = false;
    if (enterPending.current) {
      enterPending.current = false;
      setTimeout(submit, 0);
    }
  };

  useEffect(() => {
    if (!session.finished) inputRef.current?.focus();
  }, [session.finished, answerIn]);

  const latinInKoreanMode = answerIn === "korean" && /[a-z]/i.test(value);

  let hint: HintTarget = null;
  if (korean && !revealed) {
    if (status === "correct") hint = { special: "enter" };
    else if (status === "wrong") hint = { special: "backspace" };
    else hint = { jamo: korean.target[korean.correctCount] };
  }

  return (
    <SessionLayout
      title="Typing"
      done={session.done}
      total={session.total}
      actions={
        <>
          <Segmented
            label="Answer in"
            value={answerIn}
            onChange={(next) => {
              setAnswerIn(next);
              setValue("");
            }}
            options={[
              { value: "korean", label: "Type Korean" },
              { value: "english", label: "Type English" },
            ]}
          />
          {answerIn === "korean" && (
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={showKeyboard}
                onChange={(e) => setShowKeyboard(e.target.checked)}
                className="size-4 accent-pink-500"
              />
              Key hints
            </label>
          )}
        </>
      }
    >
      {session.finished || !card ? (
        <SessionSummary
          total={session.total}
          firstTryCount={session.firstTryCount}
          missed={session.missed}
          onRestart={(subset) => {
            session.restart(subset);
            reset();
          }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1 pt-2 text-center sm:pt-8">
            <div className="flex items-center gap-2">
              {korean ? (
                <KoreanProgress key={card.id} text={card.korean} match={korean} />
              ) : (
                <span className="text-5xl font-bold break-keep sm:text-6xl">{card.korean}</span>
              )}
              <SpeakButton text={card.korean} />
            </div>
            <p
              className={`min-h-7 text-lg text-slate-500 dark:text-slate-400 ${
                answerIn === "english" && !revealed && status !== "correct" ? "invisible" : ""
              }`}
            >
              {card.english.join(" · ")}
            </p>
          </div>

          <form
            className="w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={inputRef}
              onAnimationEnd={() => setShaking(false)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onCompositionStart={() => (composing.current = true)}
              onCompositionEnd={onCompositionEnd}
              lang={answerIn === "korean" ? "ko" : "en"}
              placeholder={answerIn === "korean" ? "한국어로 입력하세요" : "Type the English meaning"}
              aria-label={answerIn === "korean" ? "Type the word in Korean" : "Type the English meaning"}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              readOnly={revealed}
              className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-center text-2xl outline-none transition dark:bg-slate-900 ${
                INPUT_STYLES[revealed ? "empty" : status]
              } ${shaking ? "shake" : ""}`}
            />
            <Feedback status={status} revealed={revealed} latin={latinInKoreanMode} />

            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  // In Korean mode the answer is already on screen, so this skips.
                  if (answerIn === "korean") {
                    session.answer(false);
                    reset();
                  } else {
                    setRevealed(true);
                    inputRef.current?.focus();
                  }
                }}
                disabled={revealed || status === "correct"}
                className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {answerIn === "korean" ? "Skip" : "Show answer"}
              </button>
              <button
                type="submit"
                disabled={!revealed && status !== "correct"}
                className="rounded-xl bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-40"
              >
                Next ↵
              </button>
            </div>
          </form>

          {korean && showKeyboard && (
            <div className="mt-auto w-full max-w-xl">
              <KeyboardHint target={hint} />
            </div>
          )}
        </div>
      )}
    </SessionLayout>
  );
}

/** The target word, coloured syllable by syllable as you type it. */
function KoreanProgress({ text, match }: { text: string; match: KoreanMatch }) {
  let start = 0;
  return (
    <span className="text-5xl font-bold break-keep sm:text-6xl" aria-label={text}>
      {[...text].map((char, i) => {
        const keys = /[\p{L}\p{N}\s]/u.test(char) ? charToKeystrokes(char).length : 0;
        const end = start + keys;
        const { correctCount, status } = match;
        let color = "";
        if (status === "correct" || (keys > 0 && end <= correctCount)) color = "text-emerald-500";
        else if (status === "wrong" && start <= correctCount && correctCount < end) color = "text-rose-500";
        else if (start <= correctCount && correctCount < end) color = "underline decoration-pink-500 underline-offset-8";
        start = end;
        return (
          <span key={i} className={`transition-colors ${color}`}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

function Feedback({ status, revealed, latin }: { status: MatchStatus; revealed: boolean; latin: boolean }) {
  let message = " ";
  let color = "text-slate-500 dark:text-slate-400";
  if (revealed) {
    message = "No worries, this one will come back later. Press Enter to continue.";
  } else if (latin) {
    message = "Looks like your keyboard is in English. Switch it to Korean (Mac: Ctrl+Space, Windows: 한/영 or Right Alt).";
    color = "text-amber-600 dark:text-amber-400";
  } else if (status === "partial") {
    message = "Looking good…";
    color = "text-sky-600 dark:text-sky-400";
  } else if (status === "wrong") {
    message = "Not quite. Backspace and try again.";
    color = "text-rose-600 dark:text-rose-400";
  } else if (status === "correct") {
    message = "Correct! Press Enter for the next word.";
    color = "text-emerald-600 dark:text-emerald-400";
  }
  return <p className={`my-2 min-h-10 text-center text-sm ${color}`}>{message}</p>;
}
