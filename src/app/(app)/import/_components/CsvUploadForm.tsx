"use client";

import { useState } from "react";
import {
  parsePreviewCsv,
  importTransactions,
} from "@/lib/actions/csv";
import type { PreviewResult, ImportResult } from "@/lib/actions/csv";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: number;
  name: string | null;
  email: string;
};

type Props = {
  users: User[];
  currentUserId: number;
};

type Step = "upload" | "preview" | "done";

function formatDate(d: Date | string): string {
  const date = new Date(d);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

const TYPE_LABEL: Record<string, string> = {
  expense: "支出",
  income: "収入",
  transfer: "振替",
};

export default function CsvUploadForm({ users, currentUserId }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [cardHolderUserMap, setCardHolderUserMap] = useState<
    Record<string, number>
  >({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const previewResult = await parsePreviewCsv(formData);

      const initialMap: Record<string, number> = {};
      for (const holder of previewResult.uniqueCardHolders) {
        initialMap[holder] = currentUserId;
      }

      setPreview(previewResult);
      setCardHolderUserMap(initialMap);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport() {
    if (!preview) return;
    setError(null);
    setIsLoading(true);
    try {
      const importResult = await importTransactions({
        transactions: preview.transactions,
        cardHolderUserMap,
        defaultUserId: currentUserId,
      });
      setResult(importResult);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setStep("upload");
    setPreview(null);
    setCardHolderUserMap({});
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: ファイル選択 */}
      {step === "upload" && (
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">CSVファイル</label>
            <Input
              type="file"
              name="file"
              accept=".csv"
              required
            />
            <p className="text-xs text-muted-foreground">
              SMBC銀行明細 または Vpass明細 のCSVファイル
            </p>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "解析中..." : "解析する"}
          </Button>
        </form>
      )}

      {/* Step 2: プレビュー */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge
              variant={
                preview.sourceType === "smbc_bank" ? "default" : "secondary"
              }
            >
              {preview.sourceType === "smbc_bank" ? "SMBC銀行" : "Vpassカード"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {preview.transactions.length} 件 ／{" "}
              {formatDate(preview.dateRange.from)} 〜{" "}
              {formatDate(preview.dateRange.to)}
            </span>
          </div>

          {/* Vpass で複数 cardHolder がいる場合のマッピング UI */}
          {preview.sourceType === "smbc_card" &&
            preview.uniqueCardHolders.length > 1 && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <p className="text-sm font-medium">
                    カード保有者とユーザーの対応を設定:
                  </p>
                  {preview.uniqueCardHolders.map((holder) => (
                    <div key={holder} className="flex items-center gap-3">
                      <span className="text-sm w-44 truncate">{holder}</span>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={String(cardHolderUserMap[holder] ?? currentUserId)}
                        onValueChange={(val) =>
                          setCardHolderUserMap((prev) => ({
                            ...prev,
                            [holder]: Number(val),
                          }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.name ?? u.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* トランザクション一覧（最大10件） */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.transactions.slice(0, 10).map((t, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(t.usageDate)}
                    </TableCell>
                    <TableCell className="truncate max-w-[180px]">
                      {t.description}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {TYPE_LABEL[t.type] ?? t.type}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.amount.toLocaleString()} 円
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {preview.transactions.length > 10 && (
              <p className="text-xs text-muted-foreground px-4 py-2 border-t">
                他 {preview.transactions.length - 10} 件...
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading ? "取り込み中..." : "取り込む"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 完了 */}
      {step === "done" && result && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-green-800">
                {result.inserted} 件取り込み・{result.skipped} 件スキップ
              </p>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button onClick={handleReset}>続けてインポート</Button>
            <Button variant="outline" asChild>
              <a href="/">ホームへ戻る</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
