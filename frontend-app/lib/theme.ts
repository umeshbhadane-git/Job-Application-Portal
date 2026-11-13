export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "job-portal-theme";

export function getSavedTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event("careerbridge-theme-change"));
}
