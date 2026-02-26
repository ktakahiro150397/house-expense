"use client";

import { Check } from "lucide-react";
import { CHARACTER_THEMES } from "@/lib/themes";
import { useCharacterTheme } from "./AccentColorProvider";

export default function AccentColorPicker() {
  const { themeId, setTheme } = useCharacterTheme();

  return (
    <div className="flex items-center gap-2">
      {CHARACTER_THEMES.map(({ id, name, accentColor }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          aria-label={name}
          title={name}
          className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: accentColor }}
        >
          {themeId === id && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
