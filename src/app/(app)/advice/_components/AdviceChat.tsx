"use client";

import { useState, useTransition } from "react";
import { requestAdvice, type AdviceResult } from "@/lib/actions/advice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Bot } from "lucide-react";

type DataSource = {
  id: number;
  name: string;
  type: string;
  institution: string | null;
};

const PRESET_QUESTIONS = [
  "今月の支出を分析して",
  "先月と比べてどうだった？",
  "カテゴリ別の内訳を教えて",
  "節約できそうな項目は？",
  "今月の共有費はいくら？",
];

export default function AdviceChat({
  dataSources,
}: {
  dataSources: DataSource[];
}) {
  const [question, setQuestion] = useState("");
  const [selectedDataSourceIds, setSelectedDataSourceIds] = useState<number[]>(
    []
  );
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleDataSource(id: number) {
    setSelectedDataSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAllDataSources() {
    if (selectedDataSourceIds.length === dataSources.length) {
      setSelectedDataSourceIds([]);
    } else {
      setSelectedDataSourceIds(dataSources.map((ds) => ds.id));
    }
  }

  function handlePreset(q: string) {
    setQuestion(q);
  }

  function handleSubmit() {
    if (!question.trim() || isPending) return;
    const ids =
      selectedDataSourceIds.length > 0 ? selectedDataSourceIds : undefined;
    startTransition(async () => {
      const res = await requestAdvice(question.trim(), ids);
      setResult(res);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const allSelected = selectedDataSourceIds.length === dataSources.length;

  return (
    <div className="space-y-4">
      {/* データソースフィルタ */}
      {dataSources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              対象データソース（未選択時は全対象）
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="all-sources"
                checked={allSelected}
                onCheckedChange={toggleAllDataSources}
              />
              <Label htmlFor="all-sources" className="cursor-pointer text-sm">
                すべて選択
              </Label>
            </div>
            {dataSources.map((ds) => (
              <div key={ds.id} className="flex items-center gap-2">
                <Checkbox
                  id={`ds-${ds.id}`}
                  checked={selectedDataSourceIds.includes(ds.id)}
                  onCheckedChange={() => toggleDataSource(ds.id)}
                />
                <Label
                  htmlFor={`ds-${ds.id}`}
                  className="cursor-pointer text-sm"
                >
                  {ds.name}
                  {ds.institution && (
                    <span className="ml-1 text-muted-foreground">
                      ({ds.institution})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* プリセット質問 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            よくある質問
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <Button
              key={q}
              variant="outline"
              size="sm"
              onClick={() => handlePreset(q)}
              className="text-sm"
            >
              {q}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 質問入力 */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="家計についての質問を入力してください（Ctrl+Enter で送信）"
            rows={3}
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  送信
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 回答エリア */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              AI アドバイス
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.error ? (
              <p className="text-destructive text-sm">{result.error}</p>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-muted/40 rounded-md p-4">
                {result.answer}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
