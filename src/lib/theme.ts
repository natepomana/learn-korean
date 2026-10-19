import { useEffect } from "react";
import { useStoredState } from "./useStoredState";

export type Theme = "system" | "light" | "dark";

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

// Keep in sync with the inline script in index.html, which applies the theme
// before the app loads so there's no flash of the wrong colours.
function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && darkQuery().matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#020617" : "#f8fafc");
}

export function useTheme() {
  const [theme, setTheme] = useStoredState<Theme>("theme", "system");

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const query = darkQuery();
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  return [theme, setTheme] as const;
}
