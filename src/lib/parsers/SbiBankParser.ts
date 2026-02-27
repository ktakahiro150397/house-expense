import Papa from "papaparse";
import { generateHashKey } from "@/lib/hash";
import type { ParsedTransaction, TransactionParser, TransactionType } from "@/lib/parsers/types";

const DEFAULT_TRANSFER_KEYWORDS = ["ＳＢＩハイブリッド預金"];

export class SbiBankParser implements TransactionParser {
  private readonly transferKeywords: string[];

  constructor(options?: { transferKeywords?: string[] }) {
    this.transferKeywords = options?.transferKeywords ?? DEFAULT_TRANSFER_KEYWORDS;
  }

  parse(content: string): ParsedTransaction[] {
    const result = Papa.parse<string[]>(content, {
      skipEmptyLines: true,
    });

    const transactions: ParsedTransaction[] = [];

    for (const row of result.data) {
      // ヘッダー行をスキップ（col0 が "日付"）
      if (row[0] === "日付") continue;

      const dateStr = row[0]?.trim();
      if (!dateStr) continue;

      // 日付パース: "2024/09/27" → new Date(2024, 8, 27)
      const dateParts = dateStr.split("/");
      if (dateParts.length !== 3) continue;
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0始まり
      const day = parseInt(dateParts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) continue;
      const usageDate = new Date(year, month, day);

      const rawDescription = row[1]?.trim() ?? "";
      const withdrawal = row[2]?.trim(); // 出金金額(円)
      const deposit = row[3]?.trim();   // 入金金額(円)

      // 金額の決定（カンマ除去）
      let amount: number;
      if (deposit) {
        amount = parseInt(deposit.replace(/,/g, ""), 10);
      } else if (withdrawal) {
        amount = parseInt(withdrawal.replace(/,/g, ""), 10);
      } else {
        continue;
      }
      if (isNaN(amount)) continue;

      // type 判定
      const isTransferKw = this.transferKeywords.some((kw) => rawDescription.includes(kw));
      let type: TransactionType;
      if (deposit) {
        type = isTransferKw ? "transfer" : "income";
      } else {
        type = isTransferKw ? "transfer" : "expense";
      }

      const hashKey = generateHashKey(usageDate, amount, rawDescription);

      transactions.push({ usageDate, amount, description: rawDescription, type, hashKey });
    }

    return transactions;
  }
}
