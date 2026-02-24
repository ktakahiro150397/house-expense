import { auth, signOut } from "@/lib/auth";
import NavLinks from "./NavLinks";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AccentColorPicker from "./AccentColorPicker";

export default async function Sidebar() {
  const session = await auth();

  return (
    <aside className="hidden md:flex h-screen w-56 flex-col border-r bg-card">
      {/* ロゴ */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight">家計簿</span>
      </div>

      {/* ナビリンク */}
      <NavLinks />

      {/* 外観設定・ユーザー情報 */}
      <div className="border-t p-3 space-y-3">
        {/* テーマ・カラー */}
        <div className="px-1 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">外観</p>
            <ThemeToggle />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">カラー</p>
            <AccentColorPicker />
          </div>
        </div>

        {/* ユーザー情報・ログアウト */}
        <div className="border-t pt-3">
          <div className="mb-2 px-1">
            <p className="text-xs font-medium truncate">
              {session?.user?.name ?? session?.user?.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}
