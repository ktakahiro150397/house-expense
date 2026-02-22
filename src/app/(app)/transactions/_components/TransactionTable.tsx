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
import { Camera } from "lucide-react";
import {
  updateTransactionCategory,
  toggleTransactionShared,
} from "@/lib/actions/transactions";
import ReceiptUploadDialog from "./ReceiptUploadDialog";

type TransactionWithCategory = {
  id: number;
  usageDate: Date;
  amount: number;
  description: string;
  type: string;
  isShared: boolean;
  receiptImageUrl: string | null;
  category: { id: number; name: string } | null;
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
    ) => {
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

  const [receiptDialog, setReceiptDialog] = useState<{
    transactionId: number;
    description: string;
    imageUrl: string | null;
  } | null>(null);

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

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">日付</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="whitespace-nowrap">種別</TableHead>
              <TableHead className="whitespace-nowrap">カテゴリ</TableHead>
              <TableHead className="text-right whitespace-nowrap">金額</TableHead>
              <TableHead className="text-center whitespace-nowrap">共有</TableHead>
              <TableHead className="text-center whitespace-nowrap">レシート</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optimisticTxns.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                    <SelectTrigger className="w-36 h-8 text-sm">
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
                  {t.receiptItems.length > 0 ? (
                    <Link
                      href={`/transactions/${t.id}/receipt`}
                      className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors"
                      title="レシート解析結果を確認・編集"
                    >
                      <Camera className="size-4 text-green-600" />
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        setReceiptDialog({
                          transactionId: t.id,
                          description: t.description,
                          imageUrl: t.receiptImageUrl,
                        })
                      }
                      className="inline-flex items-center justify-center rounded p-1 hover:bg-muted transition-colors"
                      title="レシート画像"
                    >
                      <Camera
                        className={`size-4 ${
                          t.receiptImageUrl
                            ? "text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {receiptDialog && (
        <ReceiptUploadDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setReceiptDialog(null);
          }}
          transactionId={receiptDialog.transactionId}
          description={receiptDialog.description}
          initialImageUrl={receiptDialog.imageUrl}
          onComplete={() => {
            setReceiptDialog(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
