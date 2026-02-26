"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

const OPTIONS: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
  { value: "light",  icon: Sun,     label: "ライト" },
  { value: "dark",   icon: Moon,    label: "ダーク" },
  { value: "system", icon: Monitor, label: "システム" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex rounded-md border overflow-hidden" aria-hidden>
        {OPTIONS.map((o) => (
          <div key={o.value} className="h-7 w-7 bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex rounded-md border overflow-hidden">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={cn(
            "h-7 w-7 flex items-center justify-center transition-colors",
            theme === value
              ? "bg-foreground text-background"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
