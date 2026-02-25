"use client";

import { useCharacterTheme } from "./AccentColorProvider";

export default function CharacterOverlay() {
  const { theme } = useCharacterTheme();

  if (!theme.characterImage) return null;

  return (
    // fixed・pointer-events-none でコンテンツ操作を妨げない
    // z-index は低め（コンテンツより後ろ、背景より前）
    <div
      className="fixed bottom-0 right-0 pointer-events-none select-none z-0"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={theme.characterImage}
        alt=""
        className="h-64 w-auto opacity-20 object-contain"
      />
    </div>
  );
}
