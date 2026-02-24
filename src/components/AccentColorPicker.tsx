"use client";

import { Check } from "lucide-react";
import { ACCENTS, useAccentColor } from "./AccentColorProvider";

export default function AccentColorPicker() {
  const { accent, setAccent } = useAccentColor();

  return (
    <div className="flex items-center gap-2">
      {ACCENTS.map(({ id, label, color }) => (
        <button
          key={id}
          onClick={() => setAccent(id)}
          aria-label={label}
          title={label}
          className="h-6 w-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: color }}
        >
          {accent === id && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
