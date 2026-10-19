import { useEffect, useMemo, useState } from "react";
import { Flashcards } from "./components/Flashcards";
import { Home } from "./components/Home";
import { TypingPractice } from "./components/TypingPractice";
import { cardsFor, DECKS } from "./lib/decks";
import { useStoredState } from "./lib/useStoredState";

export type Route = "home" | "flashcards" | "typing";

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash === "flashcards" || hash === "typing" ? hash : "home";
}

// Hash routes keep this a plain static site (no server rewrites needed) and
// make the phone's back button return to the home screen.
function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function App() {
  const route = useRoute();
  const [storedDeckIds, setDeckIds] = useStoredState<string[]>("decks", DECKS.map((d) => d.id));
  const deckIds = storedDeckIds.filter((id) => DECKS.some((d) => d.id === id));
  const selected = deckIds.length ? deckIds : DECKS.map((d) => d.id);
  const selectedKey = selected.join(",");
  const cards = useMemo(() => cardsFor(selectedKey.split(",")), [selectedKey]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {route === "home" && <Home selected={selected} onSelect={setDeckIds} wordCount={cards.length} />}
      {route === "flashcards" && <Flashcards cards={cards} />}
      {route === "typing" && <TypingPractice cards={cards} />}
    </div>
  );
}
