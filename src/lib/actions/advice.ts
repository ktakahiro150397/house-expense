"use server";

import { auth } from "@/lib/auth";
import { createGeminiClient } from "@/lib/gemini";
import {
  adviceFunctionDeclarations,
  callAdviceFunction,
  type AdviceFunctionName,
} from "@/lib/gemini-advice";
import type { Content } from "@google/generative-ai";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type AdviceResult = {
  answer: string;
  suggestedQuestions?: string[];
  error?: string;
};

const SYSTEM_PROMPT = `あなたは公認ファイナンシャルプランナー（CFP）の資格を持つ家計管理の専門アドバイザーです。
ユーザーの家計データを詳しく分析し、専門的かつわかりやすい日本語で回答してください。

【回答スタイル】
- 必ずMarkdown形式で回答すること（見出し・箇条書き・太字・表を積極活用）
- 金額は「円」単位、3桁カンマ表記（例: 12,500円）
- 前月比・前年比などの増減率（%）を具体的に示すこと
- 表面的な集計にとどまらず、パターン・傾向・異常値を積極的に指摘すること

【データ取得指針】
- 比較分析が有効な場面では自発的に過去月のデータも取得して比較すること
- 収支を見る際は収入データ（getIncomeExpenseSummary）も取得すること
- ローン・未精算共有費がある場合は積極的に言及すること
- 商品の価格履歴がある場合はトレンドに言及すること

今日の日付: ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}`;

export async function requestAdvice(
  question: string,
  history: ChatMessage[],
  dataSourceIds?: number[]
): Promise<AdviceResult> {
  const session = await auth();
  if (!session?.user) {
    return { answer: "", error: "認証が必要です" };
  }

  const genAI = createGeminiClient();
  if (!genAI) {
    // API キー未設定 → モック回答
    return {
      answer: `【デモモード】GEMINI_API_KEY が設定されていないため、実際のデータ分析はできません。

ご質問：「${question}」

本物のアドバイスを受けるには、.env.local に GEMINI_API_KEY を設定してください。
設定後は、家計データをもとに以下のような分析が可能になります：
- 月別支出の推移分析
- カテゴリ別の支出内訳
- 節約できる項目の特定
- 前月比・予算との比較`,
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      tools: [{ functionDeclarations: adviceFunctionDeclarations as never }],
      systemInstruction: SYSTEM_PROMPT,
    });

    // dataSourceIds をコンテキストとして質問に付加
    const contextNote =
      dataSourceIds && dataSourceIds.length > 0
        ? `\n（対象データソースID: ${dataSourceIds.join(", ")}）`
        : "";
    const fullQuestion = question + contextNote;

    // 過去の会話履歴を Gemini の Content 形式に変換
    const geminiHistory: Content[] = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    let response = await chat.sendMessage(fullQuestion);

    // Function Calling ループ（最大 5 回）
    for (let i = 0; i < 5; i++) {
      const candidate = response.response.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      const functionCalls = parts.filter((p) => p.functionCall);
      if (functionCalls.length === 0) break;

      // 並列で DB 関数を実行
      const functionResults = await Promise.all(
        functionCalls.map(async (part) => {
          const fc = part.functionCall!;
          const result = await callAdviceFunction(
            fc.name as AdviceFunctionName,
            fc.args as Record<string, unknown>
          );
          return {
            functionResponse: {
              name: fc.name,
              response: { result },
            },
          };
        })
      );

      response = await chat.sendMessage(functionResults as never);
    }

    const finalText = response.response.text();

    // 会話コンテキストを活かして次の質問候補を生成（Function Calling なし）
    let suggestedQuestions: string[] = [];
    try {
      const suggestResponse = await chat.sendMessage(
        "この会話の内容を踏まえて、ユーザーが次に聞きたいと思われる質問を4つ提案してください。" +
        "JSON配列形式のみで返してください（説明・前置き不要）。例: [\"質問1\", \"質問2\", \"質問3\", \"質問4\"]"
      );
      const raw = suggestResponse.response.text().trim();
      // ```json ... ``` や余分なテキストを除去して JSON 部分だけ抽出
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as unknown;
        if (Array.isArray(parsed)) {
          suggestedQuestions = parsed
            .filter((q): q is string => typeof q === "string")
            .slice(0, 4);
        }
      }
    } catch {
      // 提案生成に失敗しても本体レスポンスには影響させない
    }

    return { answer: finalText, suggestedQuestions };
  } catch (err) {
    console.error("Gemini advice error:", err);
    return {
      answer: "",
      error: err instanceof Error ? err.message : "アドバイスの取得に失敗しました",
    };
  }
}
