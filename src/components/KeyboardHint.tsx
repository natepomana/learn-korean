import { DUBEOLSIK } from "../lib/hangul";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// Reverse lookup: physical key → the jamo printed on it (plain and with Shift).
const LABELS: Record<string, { plain?: string; shifted?: string }> = {};
for (const [jamo, { key, shift }] of Object.entries(DUBEOLSIK)) {
  LABELS[key] ??= {};
  LABELS[key][shift ? "shifted" : "plain"] = jamo;
}

export type HintTarget = { jamo: string } | { special: "backspace" | "enter" } | null;

/** A 두벌식 keyboard map that lights up the next key to press. */
export function KeyboardHint({ target }: { target: HintTarget }) {
  const next = target && "jamo" in target ? (target.jamo === " " ? { key: "space" } : DUBEOLSIK[target.jamo]) : undefined;
  const special = target && "special" in target ? target.special : undefined;
  const isLit = (key: string) => next?.key === key || special === key;
  const shiftLit = Boolean(next?.shift);

  return (
    <div className="w-full select-none" aria-hidden>
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {ROWS.map((row, i) => (
          <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
            {i === 2 && <WideKey label="⇧ Shift" lit={shiftLit} />}
            {[...row].map((key) => (
              <Key key={key} letter={key} lit={isLit(key)} useShifted={isLit(key) && shiftLit} />
            ))}
            {i === 2 && <WideKey label="⌫" lit={special === "backspace"} />}
          </div>
        ))}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          <WideKey label="space" lit={isLit("space")} className="w-1/2" />
          <WideKey label="Enter ↵" lit={special === "enter"} />
        </div>
      </div>
    </div>
  );
}

function Key({ letter, lit, useShifted }: { letter: string; lit: boolean; useShifted: boolean }) {
  const { plain, shifted } = LABELS[letter] ?? {};
  return (
    <div
      className={`relative flex h-11 w-[9%] max-w-12 flex-col items-center justify-center rounded-md border text-base transition sm:h-12 ${
        lit
          ? "scale-110 border-pink-500 bg-pink-500 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      {shifted && (
        <span className={`absolute top-0.5 right-1 text-[10px] ${lit && useShifted ? "font-bold" : "opacity-60"}`}>
          {shifted}
        </span>
      )}
      <span className="font-semibold">{lit && useShifted ? shifted : plain}</span>
      <span className={`text-[10px] uppercase ${lit ? "text-pink-100" : "text-slate-400"}`}>{letter}</span>
    </div>
  );
}

function WideKey({ label, lit, className = "" }: { label: string; lit: boolean; className?: string }) {
  return (
    <div
      className={`flex h-11 min-w-14 items-center justify-center rounded-md border px-2 text-xs font-medium transition sm:h-12 ${className} ${
        lit
          ? "border-pink-500 bg-pink-500 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
      }`}
    >
      {label}
    </div>
  );
}
