import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { CHARACTER_THEMES } from "@/lib/themes";
import { notFound } from "next/navigation";

export default async function AdminThemesPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">テーママスタ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          テーマ定義はコードで管理しています:{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            src/lib/themes.ts
          </code>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          テーマを追加・変更する場合は上記ファイルと{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
            src/app/globals.css
          </code>{" "}
          を編集してください。
        </p>
      </div>

      <div className="space-y-3">
        {CHARACTER_THEMES.map((theme) => (
          <div
            key={theme.id}
            className="border rounded-lg p-4 flex items-center gap-4 bg-card"
          >
            {/* アクセントカラースウォッチ */}
            <div
              className="h-10 w-10 rounded-full shrink-0 border border-border/50"
              style={{ backgroundColor: theme.accentColor }}
            />

            {/* テーマ情報 */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-medium">{theme.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                id: {theme.id}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                accentColor: {theme.accentColor}
              </p>
              {theme.characterImage ? (
                <p className="text-xs text-muted-foreground font-mono">
                  image: {theme.characterImage}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  キャラクター画像なし
                </p>
              )}
            </div>

            {/* キャラクター画像プレビュー */}
            {theme.characterImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.characterImage}
                alt={theme.name}
                className="h-14 w-14 object-contain opacity-80 shrink-0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
