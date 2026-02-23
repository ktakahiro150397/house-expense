"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requestAdvice, type ChatMessage } from "@/lib/actions/advice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Bot, User, RotateCcw } from "lucide-react";

type DataSource = {
  id: number;
  name: string;
  type: string;
  institution: string | null;
};

const PRESET_QUESTIONS = [
  "今月の収支を分析して",
  "先月と比べてどうだった？",
  "カテゴリ別の内訳を教えて",
  "節約できそうな項目は？",
  "ローンの返済状況を教えて",
  "未精算の共有費はいくら？",
];

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-1 mt-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 bg-muted font-medium text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block bg-muted rounded p-2 text-xs font-mono overflow-x-auto">
              {children}
            </code>
          ) : (
            <code className="bg-muted rounded px-1 text-xs font-mono">
              {children}
            </code>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function AdviceChat({
  dataSources,
}: {
  dataSources: DataSource[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedDataSourceIds, setSelectedDataSourceIds] = useState<number[]>(
    []
  );
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

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

  function handleSubmit() {
    const question = inputText.trim();
    if (!question || isPending) return;
    setInputText("");

    const historySnapshot = [...messages];
    const newMessages: ChatMessage[] = [
      ...historySnapshot,
      { role: "user", text: question },
    ];
    setMessages(newMessages);

    startTransition(async () => {
      const ids =
        selectedDataSourceIds.length > 0 ? selectedDataSourceIds : undefined;
      const res = await requestAdvice(question, historySnapshot, ids);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          text: res.error ? `エラー: ${res.error}` : res.answer,
        },
      ]);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handlePreset(q: string) {
    setInputText(q);
  }

  function handleReset() {
    setMessages([]);
    setInputText("");
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

      {/* チャット履歴エリア */}
      <Card>
        <CardContent className="pt-4">
          <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-4 min-h-[120px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground">
                <Bot className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">
                  質問を入力するか、上のプリセットを選んでください
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownContent text={msg.text} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* ローディングインジケータ */}
            {isPending && (
              <div className="flex justify-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>分析中...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 入力エリア */}
          <div className="space-y-2 border-t pt-3">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="家計についての質問を入力してください（Ctrl+Enter で送信）"
              rows={3}
              disabled={isPending}
            />
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={messages.length === 0 || isPending}
                className="text-muted-foreground"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                会話をリセット
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!inputText.trim() || isPending}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
