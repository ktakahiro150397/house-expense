import { GoogleGenerativeAI, type FunctionDeclaration } from "@google/generative-ai";
import * as fs from "fs";

export type ReceiptItem = {
  name: string;
  price: number; // 単価（円、割引はマイナス）
  quantity: number;
};

export type ReceiptAnalysisResult = {
  items: ReceiptItem[];
  totalAmount: number | null;
};

function getApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

/** Gemini クライアントを生成（Function Calling 用に外部から使う） */
export function createGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

const receiptExtractionTool: FunctionDeclaration = {
  name: "extract_receipt_items",
  description: "レシート画像から品目一覧と合計金額を抽出する",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "品目名" },
            price: {
              type: "integer",
              description: "単価（円、割引はマイナス値）",
            },
            quantity: { type: "integer", description: "数量" },
          },
          required: ["name", "price", "quantity"],
        },
      } as never,
      totalAmount: {
        type: "integer",
        description: "レシートの合計金額（不明の場合は null）",
        nullable: true,
      },
    },
    required: ["items"],
  } as never,
};

async function analyzeReceiptWithGemini(
  imagePath: string
): Promise<ReceiptAnalysisResult> {
  const apiKey = getApiKey()!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    tools: [{ functionDeclarations: [receiptExtractionTool] }],
  });

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  const result = await model.generateContent([
    {
      inlineData: { data: base64Image, mimeType },
    },
    "このレシート画像から品目一覧と合計金額を extract_receipt_items 関数を使って抽出してください。",
  ]);

  const response = result.response;
  const functionCall = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.functionCall
  )?.functionCall;

  if (!functionCall) {
    throw new Error("Gemini から品目データを取得できませんでした");
  }

  const args = functionCall.args as {
    items: ReceiptItem[];
    totalAmount?: number | null;
  };

  return {
    items: args.items ?? [],
    totalAmount: args.totalAmount ?? null,
  };
}

export async function analyzeReceiptImage(
  imagePath: string
): Promise<ReceiptAnalysisResult> {
  if (getApiKey()) {
    return analyzeReceiptWithGemini(imagePath);
  }

  // ── モック実装（GEMINI_API_KEY 未設定時のフォールバック） ──
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    items: [
      { name: "牛乳 1L", price: 198, quantity: 2 },
      { name: "食パン 6枚切", price: 148, quantity: 1 },
      { name: "卵 10個パック", price: 298, quantity: 1 },
      { name: "割引クーポン", price: -50, quantity: 1 },
    ],
    totalAmount: 792,
  };
}
