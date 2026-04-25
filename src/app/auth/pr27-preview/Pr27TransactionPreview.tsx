"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, LockOpen } from "lucide-react";

type TransactionPreview = {
  id: number;
  usageDate: string;
  amount: number;
  description: string;
  type: "expense" | "income" | "transfer";
  typeIsOverridden: boolean;
  categoryId: number | null;
  categoryName: string | null;
  categoryIsOverridden: boolean;
  isShared: boolean;
  dataSourceName: string;
};

const categories = [
  { id: 1, name: "食費" },
  { id: 2, name: "生活費" },
  { id: 3, name: "交通費" },
];

const transactions: TransactionPreview[] = [
  {
    id: 1,
    usageDate: "2026-03-12",
    amount: 4280,
    description: "イオンスタイル",
    type: "expense",
    typeIsOverridden: false,
    categoryId: 1,
    categoryName: "食費",
    categoryIsOverridden: false,
    isShared: true,
    dataSourceName: "家族カード",
  },
  {
    id: 2,
    usageDate: "2026-03-12",
    amount: 4280,
    description: "イオンスタイル",
    type: "transfer",
    typeIsOverridden: true,
    categoryId: 2,
    categoryName: "生活費",
    categoryIsOverridden: false,
    isShared: false,
    dataSourceName: "普通口座",
  },
  {
    id: 3,
    usageDate: "2026-03-13",
    amount: 9800,
    description: "Google Cloud",
    type: "expense",
    typeIsOverridden: false,
    categoryId: null,
    categoryName: null,
    categoryIsOverridden: true,
    isShared: false,
    dataSourceName: "個人カード",
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function categorySelectClass(
  isOverridden: boolean,
  hasCategory: boolean
): string {
  if (isOverridden) return "border-blue-500";
  if (!hasCategory) return "border-amber-400";
  return "";
}

function typeSelectClass(
  type: TransactionPreview["type"],
  isOverridden: boolean
): string {
  if (isOverridden) return "border-orange-500";
  if (type === "expense") return "border-red-300";
  if (type === "income") return "border-green-300";
  return "border-slate-300";
}

export default function Pr27TransactionPreview() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        Mobile shows the card layout below `md`. Desktop shows the table layout at `md` and above.
      </div>

      <div className="md:hidden space-y-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border bg-card p-3 space-y-2 ${
              t.categoryIsOverridden ? "border-blue-500" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(t.usageDate)}
                </span>
                <div className="flex items-center gap-1 group shrink-0">
                  <Select value={t.type} onValueChange={() => undefined}>
                    <SelectTrigger
                      className={`h-7 w-20 text-xs px-2 ${typeSelectClass(t.type, t.typeIsOverridden)}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">支出</SelectItem>
                      <SelectItem value="income">収入</SelectItem>
                      <SelectItem value="transfer">振替</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    className={`p-1 rounded transition-opacity hover:bg-muted ${
                      t.typeIsOverridden
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-60"
                    }`}
                    title={
                      t.typeIsOverridden
                        ? "種別固定を解除（一括更新の対象に戻す）"
                        : "この明細の種別を固定（個別変更モード）"
                    }
                  >
                    {t.typeIsOverridden ? (
                      <Lock className="size-3.5 text-orange-500" />
                    ) : (
                      <LockOpen className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <span className="font-mono font-semibold whitespace-nowrap text-sm shrink-0">
                {t.type === "expense" ? (
                  <span className="text-red-400">-¥{Math.abs(t.amount).toLocaleString()}</span>
                ) : t.type === "income" ? (
                  <span className="text-green-500">¥{Math.abs(t.amount).toLocaleString()}</span>
                ) : (
                  <span className="text-gray-400">¥{Math.abs(t.amount).toLocaleString()}</span>
                )}
              </span>
            </div>

            <p className="text-sm font-medium truncate">{t.description}</p>

            <div className="flex items-center gap-1 group">
              <Select
                value={t.categoryId === null ? "none" : String(t.categoryId)}
                onValueChange={() => undefined}
              >
                <SelectTrigger
                  className={`h-8 text-sm flex-1 ${categorySelectClass(t.categoryIsOverridden, t.categoryId !== null)}`}
                >
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
              <button
                type="button"
                className={`p-1.5 rounded transition-opacity hover:bg-muted ${
                  t.categoryIsOverridden
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-60"
                }`}
                title={
                  t.categoryIsOverridden
                    ? "カテゴリ固定を解除（一括更新の対象に戻す）"
                    : "この明細のカテゴリを固定（個別変更モード）"
                }
              >
                {t.categoryIsOverridden ? (
                  <Lock className="size-3.5 text-blue-500" />
                ) : (
                  <LockOpen className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {t.dataSourceName}
              </span>
              <div className="flex items-center gap-1">
                <Switch checked={t.isShared} onCheckedChange={() => undefined} />
                <span className="text-xs text-muted-foreground">共有</span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(t.usageDate)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">
                  {t.description}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {t.dataSourceName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 group">
                    <Select value={t.type} onValueChange={() => undefined}>
                      <SelectTrigger
                        className={`h-8 w-24 text-sm ${typeSelectClass(t.type, t.typeIsOverridden)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">支出</SelectItem>
                        <SelectItem value="income">収入</SelectItem>
                        <SelectItem value="transfer">振替</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      className={`p-1 rounded transition-opacity hover:bg-muted ${
                        t.typeIsOverridden
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60"
                      }`}
                      title={
                        t.typeIsOverridden
                          ? "種別固定を解除（一括更新の対象に戻す）"
                          : "この明細の種別を固定（個別変更モード）"
                      }
                    >
                      {t.typeIsOverridden ? (
                        <Lock className="size-3.5 text-orange-500" />
                      ) : (
                        <LockOpen className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 group">
                    <Select
                      value={t.categoryId === null ? "none" : String(t.categoryId)}
                      onValueChange={() => undefined}
                    >
                      <SelectTrigger
                        className={`w-36 h-8 text-sm ${categorySelectClass(t.categoryIsOverridden, t.categoryId !== null)}`}
                      >
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
                    <button
                      type="button"
                      className={`p-1 rounded transition-opacity hover:bg-muted ${
                        t.categoryIsOverridden
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-60"
                      }`}
                      title={
                        t.categoryIsOverridden
                          ? "カテゴリ固定を解除（一括更新の対象に戻す）"
                          : "この明細のカテゴリを固定（個別変更モード）"
                      }
                    >
                      {t.categoryIsOverridden ? (
                        <Lock className="size-3.5 text-blue-500" />
                      ) : (
                        <LockOpen className="size-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-sm font-mono">
                  {t.type === "expense" ? (
                    <span className="text-red-400">-¥{Math.abs(t.amount).toLocaleString()}</span>
                  ) : t.type === "income" ? (
                    <span className="text-green-500">¥{Math.abs(t.amount).toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-400">¥{Math.abs(t.amount).toLocaleString()}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={t.isShared} onCheckedChange={() => undefined} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
