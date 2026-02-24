"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AccentColorProvider } from "./AccentColorProvider";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AccentColorProvider>{children}</AccentColorProvider>
    </NextThemesProvider>
  );
}
