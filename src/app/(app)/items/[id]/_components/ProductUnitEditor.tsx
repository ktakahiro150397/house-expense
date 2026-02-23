"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProductUnit } from "@/lib/actions/items";
import { useRouter } from "next/navigation";

export default function ProductUnitEditor({
  productMasterId,
  currentUnit,
}: {
  productMasterId: number;
  currentUnit: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentUnit ?? "");
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setValue(currentUnit ?? "");
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      await updateProductUnit(productMasterId, value || null);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例: kg, 個, 袋"
          className="h-7 text-sm w-28"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Check className="size-3" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={handleCancel}
          disabled={isPending}
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-sm text-muted-foreground">
        {currentUnit ? currentUnit : "単位未設定"}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
        title="単位を編集"
      >
        <Pencil className="size-3" />
      </Button>
    </div>
  );
}
