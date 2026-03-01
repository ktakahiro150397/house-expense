"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionItem } from "../page";

type Props = {
  transactions: TransactionItem[];
  selectedCategoryId: number | null;
  categoryName: string;
  onClose: () => void;
};

function formatDate(d: Date): string {
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function CategoryTransactionTable({
  transactions,
  selectedCategoryId,
  categoryName,
  onClose,
}: Props) {
  const { filtered, subtotal } = useMemo(() => {
    const f = transactions
      .filter((t) => t.categoryId === selectedCategoryId && t.type === "expense")
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    return { filtered: f, subtotal: f.reduce((sum, t) => sum + t.amount, 0) };
  }, [transactions, selectedCategoryId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {categoryName} の明細
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {filtered.length}件 / 合計: ¥{subtotal.toLocaleString()}
            </span>
          </CardTitle>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted transition-colors shrink-0"
            aria-label="閉じる"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* モバイル: カードリスト */}
        <div className="md:hidden space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              明細がありません
            </p>
          )}
          {filtered.map((t) => (
            <div key={t.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(t.usageDate)}
                </span>
                <span className="font-mono text-sm font-semibold text-red-400">
                  -¥{Math.abs(t.amount).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm truncate">{t.description}</p>
              {t.dataSource && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t.dataSource.name}</p>
              )}
            </div>
          ))}
        </div>

        {/* デスクトップ: テーブル */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">日付</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="whitespace-nowrap">データソース</TableHead>
                <TableHead className="text-right whitespace-nowrap">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-4"
                  >
                    明細がありません
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
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
                  <TableCell className="text-right whitespace-nowrap font-mono text-sm text-red-400">
                    -¥{Math.abs(t.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
