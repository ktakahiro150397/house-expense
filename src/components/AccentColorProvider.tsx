"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  CHARACTER_THEMES,
  DEFAULT_THEME_ID,
  type CharacterTheme,
} from "@/lib/themes";

const STORAGE_KEY = "app-character-theme";

type ThemeContextValue = {
  themeId: string;
  setTheme: (id: string) => void;
  theme: CharacterTheme;
  /** @deprecated useCharacterTheme().theme.accentColor を使ってください */
  accentColor: string;
};

const defaultTheme = CHARACTER_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME_ID,
  setTheme: () => {},
  theme: defaultTheme,
  accentColor: defaultTheme.accentColor,
});

export function AccentColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);

  // localStorage から読み込み（マウント後）
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CHARACTER_THEMES.find((t) => t.id === stored)) {
      setThemeIdState(stored);
    }
  }, []);

  // data-character-theme 属性と localStorage を同期
  useEffect(() => {
    document.documentElement.setAttribute("data-character-theme", themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId]);

  const setTheme = (id: string) => {
    if (CHARACTER_THEMES.find((t) => t.id === id)) {
      setThemeIdState(id);
    }
  };

  const theme = CHARACTER_THEMES.find((t) => t.id === themeId) ?? defaultTheme;

  return (
    <ThemeContext.Provider
      value={{ themeId, setTheme, theme, accentColor: theme.accentColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** チャートなど既存コンポーネント向け互換フック */
export function useAccentColor() {
  const { accentColor } = useContext(ThemeContext);
  return { accentColor };
}

/** キャラクターテーマ全体を参照するフック */
export function useCharacterTheme() {
  return useContext(ThemeContext);
}
