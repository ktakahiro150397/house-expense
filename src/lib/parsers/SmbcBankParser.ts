import Papa from "papaparse";
import { generateHashKey } from "@/lib/hash";
import { getClensingDescription } from "@/lib/parsers/cleansing";
import type { ParsedTransaction, TransactionParser, TransactionType } from "@/lib/parsers/types";

export class SmbcBankParser implements TransactionParser {
  parse(content: string): ParsedTransaction[] {
    const result = Papa.parse<string[]>(content, {
      skipEmptyLines: true,
    });

    const transactions: ParsedTransaction[] = [];

    for (const row of result.data) {
      // ヘッダー行をスキップ（col0 が "年月日"）
      if (row[0] === "年月日") continue;

      const dateStr = row[0]?.trim();
      if (!dateStr) continue;

      // 日付パース: "2024/9/20" → new Date(2024, 8, 20)
      const dateParts = dateStr.split("/");
      if (dateParts.length !== 3) continue;
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0始まり
      const day = parseInt(dateParts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) continue;
      const usageDate = new Date(year, month, day);

      const withdrawal = row[1]?.trim();
      const deposit = row[2]?.trim();
      const rawDescription = row[3]?.trim() ?? "";

      // 金額の決定
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
      let type: TransactionType;
      if (deposit) {
        type = "income";
      } else if (
        rawDescription.includes("ENET") ||
        rawDescription.includes("カード")
      ) {
        type = "transfer";
      } else if (rawDescription.includes("ﾐﾂｲｽﾐﾄﾓｶ-ﾄﾞ")) {
        type = "transfer";
      } else {
        type = "expense";
      }

      const description = getClensingDescription(rawDescription);
      const hashKey = generateHashKey(usageDate, amount, rawDescription);

      transactions.push({ usageDate, amount, description, type, hashKey });
    }

    return transactions;
  }
}
