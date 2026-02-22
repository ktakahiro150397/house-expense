export type ReceiptItem = {
  name: string;
  price: number;     // 単価（円、割引はマイナス）
  quantity: number;
};

export type ReceiptAnalysisResult = {
  items: ReceiptItem[];
  totalAmount: number | null;
};

// TODO: AI Studio + Function Calling 実装に差し替え
// Function Calling スキーマ（参考）:
// {
//   name: "extract_receipt_items",
//   description: "レシート画像から品目を抽出する",
//   parameters: {
//     type: "object",
//     properties: {
//       items: {
//         type: "array",
//         items: {
//           type: "object",
//           properties: {
//             name: { type: "string" },
//             price: { type: "integer" },
//             quantity: { type: "integer" },
//           },
//           required: ["name", "price", "quantity"],
//         },
//       },
//       totalAmount: { type: "integer", nullable: true },
//     },
//     required: ["items"],
//   },
// }

export async function analyzeReceiptImage(
  _imagePath: string
): Promise<ReceiptAnalysisResult> {
  // ── モック実装（AI Studio 連携前の開発用） ──
  // 実際の画像は読まず、固定のダミーデータを返す
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
