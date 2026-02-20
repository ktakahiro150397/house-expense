"use client";

import { useState } from "react";
import {
  parsePreviewCsv,
  importTransactions,
} from "@/lib/actions/csv";
import type { PreviewResult, ImportResult } from "@/lib/actions/csv";

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

      // cardHolder 全員を currentUserId で初期化
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
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: ファイル選択 */}
      {step === "upload" && (
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              CSVファイル
            </label>
            <input
              type="file"
              name="file"
              accept=".csv"
              required
              className="block w-full text-sm border border-gray-300 rounded px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              SMBC銀行明細 または Vpass明細 のCSVファイル
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "解析中..." : "解析する"}
          </button>
        </form>
      )}

      {/* Step 2: プレビュー */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                preview.sourceType === "smbc_bank"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {preview.sourceType === "smbc_bank" ? "SMBC銀行" : "Vpassカード"}
            </span>
            <span className="text-sm text-gray-600">
              {preview.transactions.length} 件 ／ {formatDate(preview.dateRange.from)}{" "}
              〜 {formatDate(preview.dateRange.to)}
            </span>
          </div>

          {/* Vpass で複数 cardHolder がいる場合のマッピング UI */}
          {preview.sourceType === "smbc_card" &&
            preview.uniqueCardHolders.length > 1 && (
              <div className="space-y-2 p-3 border rounded bg-gray-50">
                <p className="text-sm font-medium">
                  カード保有者とユーザーの対応を設定:
                </p>
                {preview.uniqueCardHolders.map((holder) => (
                  <div key={holder} className="flex items-center gap-3">
                    <span className="text-sm w-44 truncate">{holder}</span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={cardHolderUserMap[holder] ?? currentUserId}
                      onChange={(e) =>
                        setCardHolderUserMap((prev) => ({
                          ...prev,
                          [holder]: Number(e.target.value),
                        }))
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

          {/* トランザクション一覧（最大10件） */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">日付</th>
                  <th className="text-left px-3 py-2 font-medium">説明</th>
                  <th className="text-left px-3 py-2 font-medium">種別</th>
                  <th className="text-right px-3 py-2 font-medium">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.transactions.slice(0, 10).map((t, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(t.usageDate)}
                    </td>
                    <td className="px-3 py-2 truncate max-w-[180px]">
                      {t.description}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {TYPE_LABEL[t.type] ?? t.type}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.amount.toLocaleString()} 円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.transactions.length > 10 && (
              <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50">
                他 {preview.transactions.length - 10} 件...
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "取り込み中..." : "取り込む"}
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 完了 */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">
              {result.inserted} 件取り込み・{result.skipped} 件スキップ
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              続けてインポート
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 inline-block"
            >
              ホームへ戻る
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
