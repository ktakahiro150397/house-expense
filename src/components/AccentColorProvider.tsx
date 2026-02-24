"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = "orange" | "blue" | "green" | "purple";

export const ACCENTS: { id: AccentColor; label: string; color: string }[] = [
  { id: "orange", label: "オレンジ", color: "#e8722a" },
  { id: "blue",   label: "ブルー",   color: "#2563eb" },
  { id: "green",  label: "グリーン", color: "#16a34a" },
  { id: "purple", label: "パープル", color: "#9333ea" },
];

const STORAGE_KEY = "app-accent-color";

type AccentContextValue = {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  accentColor: string;
};

const AccentContext = createContext<AccentContextValue>({
  accent: "orange",
  setAccent: () => {},
  accentColor: "#e8722a",
});

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>("orange");

  // localStorage から読み込み（マウント後）
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AccentColor | null;
    if (stored && ACCENTS.find((a) => a.id === stored)) {
      setAccentState(stored);
    }
  }, []);

  // data-accent 属性と localStorage を同期
  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem(STORAGE_KEY, accent);
  }, [accent]);

  const setAccent = (a: AccentColor) => setAccentState(a);
  const accentColor = ACCENTS.find((a) => a.id === accent)?.color ?? "#e8722a";

  return (
    <AccentContext.Provider value={{ accent, setAccent, accentColor }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccentColor() {
  return useContext(AccentContext);
}
