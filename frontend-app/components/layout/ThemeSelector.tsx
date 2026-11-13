"use client";

import { useSyncExternalStore } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { applyTheme, getSavedTheme, type Theme } from "@/lib/theme";

const subscribeToTheme = (onStoreChange: () => void) => {
  window.addEventListener("careerbridge-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("careerbridge-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

const getThemeSnapshot = () => getSavedTheme();
const getServerThemeSnapshot = (): Theme => "light";

export default function ThemeSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const selectTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
  };

  return (
    <div
      role="group"
      aria-label="Choose appearance theme"
      className={`grid grid-cols-2 gap-1 rounded-xl p-1 ${
        compact
          ? "border border-white/10 bg-white/[0.05]"
          : "border border-[#e7e8e1] bg-[#f3f4ef]"
      }`}
    >
      {(
        [
          ["light", "Light", Sun],
          ["dark", "Dark", Moon],
        ] as const
      ).map(([value, label, Icon]) => {
        const selected = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => selectTheme(value)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              selected
                ? compact
                  ? "bg-[#c4e58a] text-[#26331f]"
                  : "bg-white text-[#34472c] shadow-sm"
                : compact
                  ? "text-[#c2c8bc] hover:bg-white/10 hover:text-white"
                  : "text-[#777a71] hover:bg-white/70 hover:text-[#36472e]"
            }`}
          >
            <Icon size={14} />
            {label}
            {selected && <Check size={12} className="ml-auto" />}
          </button>
        );
      })}
    </div>
  );
}
