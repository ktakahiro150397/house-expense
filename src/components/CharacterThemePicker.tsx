"use client";

import { Check } from "lucide-react";
import { CHARACTER_THEMES } from "@/lib/themes";
import { useCharacterTheme } from "./AccentColorProvider";

export default function CharacterThemePicker() {
  const { themeId, setTheme } = useCharacterTheme();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CHARACTER_THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setTheme(theme.id)}
          aria-label={theme.name}
          title={theme.name}
          className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/50"
          style={{ backgroundColor: theme.accentColor }}
        >
          {themeId === theme.id && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
