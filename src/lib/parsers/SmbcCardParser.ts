import Papa from "papaparse";
import { generateHashKey } from "@/lib/hash";
import type { ParsedTransaction, TransactionParser } from "@/lib/parsers/types";

const DATE_PATTERN = /^\d{4}\/\d{1,2}\/\d{1,2}$/;

export class SmbcCardParser implements TransactionParser {
  parse(content: string): ParsedTransaction[] {
    const result = Papa.parse<string[]>(content, {
      skipEmptyLines: false,
    });

    const transactions: ParsedTransaction[] = [];
    let currentCardHolder: string | undefined = undefined;

    for (const row of result.data) {
      const col0 = row[0]?.trim() ?? "";

      // 空行スキップ
      if (row.every((cell) => !cell?.trim())) continue;

      // col0 が日付パターン → トランザクション行
      if (DATE_PATTERN.test(col0)) {
        const dateParts = col0.split("/");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const usageDate = new Date(year, month, day);

        const rawDescription = row[1]?.trim() ?? "";
        const amountStr = row[2]?.trim().replace(/,/g, "") ?? "";
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount)) continue;

        const hashKey = generateHashKey(usageDate, amount, rawDescription);

        transactions.push({
          usageDate,
          amount,
          description: rawDescription,
          type: "expense",
          hashKey,
          cardHolder: currentCardHolder,
        });
        continue;
      }

      // col0 が空 → 小計行（スキップ）
      if (!col0) continue;

      // それ以外 → セクションヘッダー行
      currentCardHolder = col0.replace(/　様$/, "").trim();
    }

    return transactions;
  }
}
