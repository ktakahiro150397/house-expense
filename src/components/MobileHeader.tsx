"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import AccentColorPicker from "@/components/AccentColorPicker";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center border-b bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <SheetContent side="left" className="w-56 p-0 flex flex-col">
          <SheetHeader className="flex h-14 flex-row items-center border-b px-4">
            <SheetTitle className="text-lg font-bold tracking-tight">家計簿</SheetTitle>
          </SheetHeader>
          <NavLinks onNavigate={() => setOpen(false)} />
          {/* 外観設定（ドロワー内フッター） */}
          <div className="border-t p-3 space-y-2 mt-auto">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">外観</p>
              <ThemeToggle />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">カラー</p>
              <AccentColorPicker />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <span className="ml-2 text-lg font-bold tracking-tight">家計簿</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
