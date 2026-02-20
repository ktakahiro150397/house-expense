"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const messages: Record<string, string> = {
    AccessDenied: "このアカウントはアクセスが許可されていません。",
    Configuration: "サーバー設定にエラーがあります。",
    Default: "ログインに失敗しました。",
  };

  const message = messages[error ?? "Default"] ?? messages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 rounded-lg border border-border shadow-sm max-w-sm w-full">
        <h1 className="text-xl font-bold text-destructive">ログインエラー</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
