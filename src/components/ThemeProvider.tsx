"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AccentColorProvider } from "./AccentColorProvider";
import CharacterOverlay from "./CharacterOverlay";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AccentColorProvider>
        {children}
        <CharacterOverlay />
      </AccentColorProvider>
    </NextThemesProvider>
  );
}
