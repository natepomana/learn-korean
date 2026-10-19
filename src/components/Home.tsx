import { DECKS } from "../lib/decks";
import type { Theme } from "../lib/theme";
import { Segmented } from "./SessionLayout";

interface Props {
  selected: string[];
  onSelect: (ids: string[]) => void;
  wordCount: number;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const MODES = [
  {
    href: "#/flashcards",
    title: "Flashcards",
    korean: "카드",
    description: "See the Korean, tap to reveal the English.",
  },
  {
    href: "#/typing",
    title: "Typing",
    korean: "타자",
    description: "Type the word in Korean or English with live feedback.",
  },
];

export function Home({ selected, onSelect, wordCount, theme, onThemeChange }: Props) {
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((d) => d !== id) : [...selected, id];
    // Keep at least one deck selected.
    if (next.length) onSelect(next);
  };

  return (
    <main className="flex flex-1 flex-col gap-8 py-6 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pink-600 dark:text-pink-400">한국어 연습</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Learn Korean</h1>
        </div>
        <Segmented
          label="Theme"
          value={theme}
          onChange={onThemeChange}
          options={[
            { value: "system", label: "Auto" },
            { value: "light", label: "☀️" },
            { value: "dark", label: "🌙" },
          ]}
        />
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-500 uppercase dark:text-slate-400">Word lists</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{wordCount} words</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DECKS.map((deck) => {
            const on = selected.includes(deck.id);
            return (
              <button
                key={deck.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(deck.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  on
                    ? "border-pink-500 bg-pink-500 text-white"
                    : "border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {deck.title} · {deck.cards.length}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {MODES.map((mode) => (
          <a
            key={mode.href}
            href={mode.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-pink-500"
          >
            <div className="text-4xl font-bold text-pink-500">{mode.korean}</div>
            <h3 className="mt-4 text-xl font-semibold">{mode.title}</h3>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{mode.description}</p>
            <span className="mt-4 inline-block text-sm font-medium text-pink-600 group-hover:translate-x-1 dark:text-pink-400">
              Start →
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
