"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  categoryName: string;
  onConfirm: () => void;
};

export default function CategoryLearnDialog({
  open,
  onOpenChange,
  description,
  categoryName,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カテゴリ辞書に登録しますか？</DialogTitle>
          <DialogDescription>
            「{description}」を「{categoryName}」としてカテゴリ辞書に登録しますか？
            <br />
            次回以降、同じ説明の明細が自動的に分類されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            スキップ
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            登録する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
