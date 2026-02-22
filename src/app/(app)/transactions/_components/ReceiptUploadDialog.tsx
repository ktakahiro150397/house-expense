"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, UploadCloud } from "lucide-react";
import { uploadReceiptImage, analyzeReceipt } from "@/lib/actions/receipts";
import type { ReceiptAnalysisResult } from "@/lib/gemini";

type Phase = "idle" | "uploading" | "uploaded" | "analyzing" | "done";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: number;
  description: string;
  initialImageUrl?: string | null;
  onComplete?: () => void;
};

export default function ReceiptUploadDialog({
  open,
  onOpenChange,
  transactionId,
  description,
  initialImageUrl,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>(
    initialImageUrl ? "uploaded" : "idle"
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl ?? null
  );
  const [result, setResult] = useState<ReceiptAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClose(open: boolean) {
    onOpenChange(open);
    if (!open) {
      // ダイアログを閉じるときに「完了」コールバックを呼ぶ
      if (phase === "done") onComplete?.();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPhase("uploading");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const { receiptImageUrl } = await uploadReceiptImage(transactionId, formData);
      setImageUrl(receiptImageUrl);
      setPhase("uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setPhase("idle");
    } finally {
      // 同じファイルを再選択できるよう input をリセット
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    setError(null);
    setPhase("analyzing");
    try {
      const analysisResult = await analyzeReceipt(transactionId);
      setResult(analysisResult);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
      setPhase("uploaded");
    }
  }

  const totalSubtotal = result?.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            レシート画像
            <span className="block text-sm font-normal text-muted-foreground truncate mt-0.5">
              {description}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded p-2">
              {error}
            </p>
          )}

          {/* idle: ファイル選択 */}
          {phase === "idle" && (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
              <UploadCloud className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                クリックして画像を選択（JPEG / PNG / WebP・10MB 以下）
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* uploading: スピナー */}
          {phase === "uploading" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">アップロード中…</p>
            </div>
          )}

          {/* uploaded: プレビュー + 解析ボタン */}
          {phase === "uploaded" && imageUrl && (
            <div className="space-y-3">
              <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border bg-muted">
                <Image
                  src={imageUrl}
                  alt="レシート"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleAnalyze}>
                  この画像で解析する
                </Button>
                <label className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>別の画像を選択</span>
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {/* analyzing: スピナー */}
          {phase === "analyzing" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Gemini で品目を解析中…
              </p>
            </div>
          )}

          {/* done: 品目テーブル */}
          {phase === "done" && result && (
            <div className="space-y-3">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>品目</TableHead>
                      <TableHead className="text-right">単価</TableHead>
                      <TableHead className="text-right">数量</TableHead>
                      <TableHead className="text-right">小計</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{item.name}</TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          ¥{item.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          ¥{(item.price * item.quantity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell colSpan={3}>合計</TableCell>
                      <TableCell className="text-right font-mono">
                        ¥{totalSubtotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {result.totalAmount !== null && (
                <p className="text-xs text-muted-foreground text-right">
                  レシート合計金額: ¥{result.totalAmount.toLocaleString()}
                </p>
              )}
              <Button asChild className="w-full">
                <Link href={`/transactions/${transactionId}/receipt`}>
                  詳細ページで確認・編集する →
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleClose(false)}
              >
                閉じる
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
