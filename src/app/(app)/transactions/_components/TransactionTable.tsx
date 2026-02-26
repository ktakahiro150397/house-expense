"use client";

import { useOptimistic, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Trash2 } from "lucide-react";
import {
  updateTransactionCategory,
  toggleTransactionShared,
  deleteTransaction,
} from "@/lib/actions/transactions";

type TransactionWithCategory = {
  id: number;
  usageDate: Date;
  amount: number;
  description: string;
  type: string;
  isShared: boolean;
  receiptImageUrl: string | null;
  category: { id: number; name: string } | null;
  dataSource: { id: number; name: string } | null;
  receiptItems: Array<{ id: number; name: string; price: number; quantity: number }>;
};

type CategoryOption = { id: number; name: string };

type Props = {
  transactions: TransactionWithCategory[];
  categories: CategoryOption[];
};

const TYPE_LABEL: Record<string, string> = {
  expense: "支出",
  income: "収入",
  transfer: "振替",
};

const TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  expense: "destructive",
  income: "default",
  transfer: "secondary",
};

function formatDate(d: Date): string {
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function TransactionTable({ transactions, categories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticTxns, updateOptimistic] = useOptimistic(
    transactions,
    (
      state,
      update:
        | { type: "category"; description: string; categoryId: number | null }
        | { type: "shared"; id: number; isShared: boolean }
        | { type: "delete"; id: number }
    ) => {
      if (update.type === "delete") {
        return state.filter((t) => t.id !== update.id);
      }
      return state.map((t) => {
        if (update.type === "category") {
          if (t.description !== update.description) return t;
          const cat = categories.find((c) => c.id === update.categoryId) ?? null;
          return { ...t, category: cat ? { id: cat.id, name: cat.name } : null };
        }
        if (update.type === "shared") {
          if (t.id !== update.id) return t;
          return { ...t, isShared: update.isShared };
        }
        return t;
      });
    }
  );

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  function handleCategoryChange(description: string, categoryId: number | null) {
    startTransition(async () => {
      updateOptimistic({ type: "category", description, categoryId });
      await updateTransactionCategory(description, categoryId);
      router.refresh();
    });
  }

  function handleSharedChange(transactionId: number, isShared: boolean) {
    startTransition(async () => {
      updateOptimistic({ type: "shared", id: transactionId, isShared });
      await toggleTransactionShared(transactionId, isShared);
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      updateOptimistic({ type: "delete", id });
      await deleteTransaction(id);
      router.refresh();
    });
    setDeleteConfirmId(null);
  }

  return (
    <>
      {/* モバイル: カード形式 */}
      <div className="md:hidden space-y-2">
        {optimisticTxns.length === 0 && (
          <p className="text-center text-muted-foreground py-8">明細がありません</p>
        )}
        {optimisticTxns.map((t) => (
          <div key={t.id} className="rounded-lg border bg-card p-3 space-y-2">
            {/* 上段: 日付・種別バッジ・金額 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(t.usageDate)}
                </span>
                <Badge variant={TYPE_VARIANT[t.type] ?? "outline"} className="text-xs shrink-0">
                  {TYPE_LABEL[t.type] ?? t.type}
                </Badge>
              </div>
              <span className="font-mono font-semibold whitespace-nowrap text-sm shrink-0">
                {t.type === "expense" ? (
                  <span className="text-destructive">-¥{Math.abs(t.amount).toLocaleString()}</span>
                ) : (
                  <span className="text-green-600">¥{Math.abs(t.amount).toLocaleString()}</span>
                )}
              </span>
            </div>

            {/* 説明 */}
            <p className="text-sm font-medium truncate">{t.description}</p>

            {/* カテゴリ選択 */}
            <Select
              value={t.category ? String(t.category.id) : "none"}
              onValueChange={(val) =>
                handleCategoryChange(t.description, val === "none" ? null : Number(val))
              }
            >
              <SelectTrigger className={`h-8 text-sm w-full ${t.category === null ? "border-amber-400" : ""}`}>
                <SelectValue placeholder="未分類" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未分類</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 下段: データソース・共有・レシート・削除 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {t.dataSource?.name ?? "—"}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <Switch
                    checked={t.isShared}
                    onCheckedChange={(checked) => handleSharedChange(t.id, checked)}
                    className="scale-90"
                  />
                  <span className="text-xs text-muted-foreground">共有</span>
                </div>
                <Link
                  href={`/transactions/${t.id}/receipt`}
                  className="inline-flex items-center justify-center rounded p-1.5 hover:bg-muted transition-colors"
                  title="レシート詳細"
                >
                  <Receipt
                    className={`size-4 ${
                      t.receiptItems.length > 0
                        ? "text-green-600"
                        : t.receiptImageUrl
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </Link>
                <button
                  onClick={() => setDeleteConfirmId(t.id)}
                  className="inline-flex items-center justify-center rounded p-1.5 hover:bg-muted transition-colors"
                  title="削除"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PC: テーブル形式 */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">日付</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="whitespace-nowrap">データソース</TableHead>
              <TableHead className="whitespace-nowrap">種別</TableHead>
              <TableHead className="whitespace-nowrap">カテゴリ</TableHead>
              <TableHead className="text-right whitespace-nowrap">金額</TableHead>
              <TableHead className="text-center whitespace-nowrap">共有</TableHead>
              <TableHead className="text-center whitespace-nowrap">レシート</TableHead>
              <TableHead className="text-center whitespace-nowrap">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optimisticTxns.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  明細がありません
                </TableCell>
              </TableRow>
            )}
            {optimisticTxns.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(t.usageDate)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">
                  {t.description}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {t.dataSource?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANT[t.type] ?? "outline"}>
                    {TYPE_LABEL[t.type] ?? t.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={t.category ? String(t.category.id) : "none"}
                    onValueChange={(val) =>
                      handleCategoryChange(
                        t.description,
                        val === "none" ? null : Number(val)
                      )
                    }
                  >
                    <SelectTrigger className={`w-36 h-8 text-sm ${t.category === null ? "border-amber-400" : ""}`}>
                      <SelectValue placeholder="未分類" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未分類</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-sm font-mono">
                  {t.type === "expense" ? "-" : ""}¥
                  {Math.abs(t.amount).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={t.isShared}
                    onCheckedChange={(checked) =>
                      handleSharedChange(t.id, checked)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Link
                    href={`/transactions/${t.id}/receipt`}
                    className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors"
                    title="レシート詳細を確認・編集"
                  >
                    <Receipt
                      className={`size-4 ${
                        t.receiptItems.length > 0
                          ? "text-green-600"
                          : t.receiptImageUrl
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    onClick={() => setDeleteConfirmId(t.id)}
                    className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors"
                    title="明細を削除"
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>明細を削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            この明細を削除しますか？この操作は取り消せません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
