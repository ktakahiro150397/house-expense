"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmbcBankParser, SmbcCardParser, SbiBankParser } from "@/lib/parsers";
import type { ParsedTransaction } from "@/lib/parsers/types";

type SourceType = "smbc_bank" | "smbc_card" | "sbi_bank";

function detectSourceType(content: string): SourceType {
  const firstLine = content.split("\n")[0];
  if (firstLine.startsWith("年月日")) return "smbc_bank";
  if (firstLine.startsWith('"日付"')) return "sbi_bank";
  return "smbc_card";
}

export type PreviewResult = {
  sourceType: SourceType;
  transactions: ParsedTransaction[];
  uniqueCardHolders: string[];
  dateRange: { from: Date; to: Date };
};

export async function parsePreviewCsv(
  formData: FormData
): Promise<PreviewResult> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証です");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ファイルが見つかりません");

  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  let content: string;
  if (uint8[0] === 0xef && uint8[1] === 0xbb && uint8[2] === 0xbf) {
    content = new TextDecoder("utf-8").decode(buffer.slice(3));
  } else {
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      content = new TextDecoder("shift-jis").decode(buffer);
    }
  }
  if (!content.trim()) throw new Error("ファイルが空です");

  const sourceType = detectSourceType(content);
  const parser =
    sourceType === "smbc_bank" ? new SmbcBankParser() :
    sourceType === "sbi_bank"  ? new SbiBankParser() :
    new SmbcCardParser();
  const transactions = parser.parse(content);

  if (transactions.length === 0) throw new Error("解析できる明細がありませんでした");

  const uniqueCardHolders = [
    ...new Set(
      transactions
        .map((t) => t.cardHolder)
        .filter((h): h is string => h !== undefined)
    ),
  ];

  const timestamps = transactions.map((t) => new Date(t.usageDate).getTime());
  const dateRange = {
    from: new Date(Math.min(...timestamps)),
    to: new Date(Math.max(...timestamps)),
  };

  return { sourceType, transactions, uniqueCardHolders, dateRange };
}

export type ImportPayload = {
  transactions: ParsedTransaction[];
  cardHolderUserMap: Record<string, number>;
  defaultUserId: number;
  dataSourceId?: number;
};

export type ImportResult = {
  inserted: number;
  skipped: number;
};

export async function importTransactions(
  payload: ImportPayload
): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証です");

  const { transactions, cardHolderUserMap, defaultUserId, dataSourceId } = payload;

  // CategoryRule を取得して description → categoryId のマップを作る
  const rules = await prisma.categoryRule.findMany();
  const ruleMap = new Map(rules.map((r) => [r.keyword, r.categoryId]));

  const data = transactions.map((t) => ({
    userId:
      t.cardHolder !== undefined
        ? (cardHolderUserMap[t.cardHolder] ?? defaultUserId)
        : defaultUserId,
    usageDate: new Date(t.usageDate),
    amount: t.amount,
    description: t.description,
    type: t.type,
    hashKey: t.hashKey,
    ...(dataSourceId !== undefined ? { dataSourceId } : {}),
    ...(ruleMap.has(t.description) ? { categoryId: ruleMap.get(t.description) } : {}),
  }));

  const result = await prisma.transaction.createMany({
    data,
    skipDuplicates: true,
  });

  return {
    inserted: result.count,
    skipped: transactions.length - result.count,
  };
}
