import type { ReactNode } from "react";
import type { Card } from "../lib/decks";
import { canSpeak, speakKorean } from "../lib/speech";

interface Props {
  title: string;
  done: number;
  total: number;
  actions?: ReactNode;
  children: ReactNode;
}

export function SessionLayout({ title, done, total, actions, children }: Props) {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 py-2">
        <a
          href="#/"
          aria-label="Back to home"
          className="-ml-2 rounded-lg px-2 py-1 text-2xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          ←
        </a>
        <h1 className="text-lg font-semibold">{title}</h1>
        <span className="ml-auto text-sm text-slate-500 tabular-nums dark:text-slate-400">
          {done} / {total}
        </span>
      </header>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      {actions && <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>}
      <div className="flex flex-1 flex-col py-6">{children}</div>
    </main>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            value === option.value
              ? "bg-white shadow-sm dark:bg-slate-950"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SpeakButton({ text }: { text: string }) {
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      aria-label={`Say ${text}`}
      title="Hear it"
      // Keep taps on the speaker from flipping the flashcard underneath.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        speakKorean(text);
      }}
      className="rounded-full p-2 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-pink-500 dark:hover:bg-slate-800"
    >
      🔊
    </button>
  );
}

export function SessionSummary({
  total,
  firstTryCount,
  missed,
  onRestart,
}: {
  total: number;
  firstTryCount: number;
  missed: Card[];
  onRestart: (subset?: Card[]) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="text-6xl">{missed.length === 0 ? "🎉" : "👏"}</div>
      <div>
        <h2 className="text-2xl font-bold">Round complete</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {firstTryCount} of {total} right on the first try
        </p>
      </div>

      {missed.length > 0 && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 text-sm font-semibold text-slate-500 uppercase dark:text-slate-400">To review</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {missed.map((card) => (
              <li key={card.id} className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-lg font-medium">{card.korean}</span>
                <span className="text-right text-slate-600 dark:text-slate-400">{card.english.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        {missed.length > 0 && (
          <button
            type="button"
            onClick={() => onRestart(missed)}
            className="flex-1 rounded-xl bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600"
          >
            Practice the {missed.length} missed
          </button>
        )}
        <button
          type="button"
          onClick={() => onRestart()}
          className={`flex-1 rounded-xl px-4 py-3 font-semibold ${
            missed.length > 0
              ? "border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          Start over
        </button>
      </div>
      <a href="#/" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
        Back to home
      </a>
    </div>
  );
}
