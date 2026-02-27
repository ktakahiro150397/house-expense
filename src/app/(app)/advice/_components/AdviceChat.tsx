"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requestAdvice, type ChatMessage } from "@/lib/actions/advice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Bot, User, RotateCcw, Settings } from "lucide-react";

type DataSource = {
  id: number;
  name: string;
  type: string;
  institution: string | null;
};

const INITIAL_QUESTIONS = [
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shownQuestions, setShownQuestions] = useState<string[]>(INITIAL_QUESTIONS);
  const messageAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTo({
        top: messageAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
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
      const assistantText = res.error ? `エラー: ${res.error}` : res.answer;
      setMessages([
        ...newMessages,
        { role: "assistant" as const, text: assistantText },
      ]);
      if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
        setShownQuestions(res.suggestedQuestions);
      }
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
    setShownQuestions(INITIAL_QUESTIONS);
  }

  const allSelected = selectedDataSourceIds.length === dataSources.length;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">AI アドバイス</h1>
        </div>
        <div className="flex gap-1">
          {dataSources.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              title="データソース設定"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            disabled={messages.length === 0 || isPending}
            title="会話をリセット"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* メッセージエリア */}
      <div ref={messageAreaRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">
              質問を入力するか、プリセットを選んでください
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

      </div>

      {/* 底部固定エリア */}
      <div className="shrink-0 border-t px-4 py-3 space-y-2">
        {/* プリセットチップ */}
        <div className="flex flex-wrap gap-1.5">
          {shownQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handlePreset(q)}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
        {/* 入力行 */}
        <div className="flex gap-2 items-end">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="家計についての質問を入力してください"
            rows={2}
            disabled={isPending}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSubmit}
            size="icon"
            disabled={!inputText.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Ctrl+Enter で送信
        </p>
      </div>

      {/* 設定 Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>対象データソース</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            未選択時は全データソースが対象になります
          </p>
          <div className="space-y-3 pt-2">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
