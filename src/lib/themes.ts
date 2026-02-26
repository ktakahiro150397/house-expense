export interface CharacterTheme {
  id: string;
  name: string;
  /** チャート・UIアクセントに使う色 (#rrggbb) */
  accentColor: string;
  /** /public 配下のキャラクター透過PNG パス */
  characterImage?: string;
}

/**
 * テーママスタ定義
 * 管理者はここを直接編集してテーマを追加・変更します。
 * 追加時は globals.css にも対応する data-character-theme セクションを追記してください。
 */
export const CHARACTER_THEMES: CharacterTheme[] = [
  {
    id: "default",
    name: "デフォルト",
    accentColor: "#e8722a",
  },
  {
    id: "sakura",
    name: "さくら",
    accentColor: "#d4499a",
    characterImage: "/themes/sakura.png",
  },
  {
    id: "sky",
    name: "スカイ",
    accentColor: "#0284c7",
    characterImage: "/themes/sky.png",
  },
  {
    id: "forest",
    name: "フォレスト",
    accentColor: "#15803d",
    characterImage: "/themes/forest.png",
  },
];

export const DEFAULT_THEME_ID = "default";
