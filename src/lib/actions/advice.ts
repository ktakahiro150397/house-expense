"use server";

import { auth } from "@/lib/auth";
import { createGeminiClient } from "@/lib/gemini";
import {
  adviceFunctionDeclarations,
  callAdviceFunction,
  type AdviceFunctionName,
} from "@/lib/gemini-advice";

export type AdviceResult = {
  answer: string;
  error?: string;
};

const SYSTEM_PROMPT = `あなたは家計管理の専門アドバイザーです。
ユーザーの家計データを分析し、わかりやすく日本語で回答してください。
金額は「円」単位で表示し、必要に応じて比較・分析・節約アドバイスを提供してください。
データが取得できた場合は、具体的な数値を示しながら回答してください。
今日の日付: ${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}`;

export async function requestAdvice(
  question: string,
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

    const chat = model.startChat();
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
    return { answer: finalText };
  } catch (err) {
    console.error("Gemini advice error:", err);
    return {
      answer: "",
      error: err instanceof Error ? err.message : "アドバイスの取得に失敗しました",
    };
  }
}
