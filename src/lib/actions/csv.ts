"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmbcBankParser, SmbcCardParser } from "@/lib/parsers";
import type { ParsedTransaction } from "@/lib/parsers/types";

type SourceType = "smbc_bank" | "smbc_card";

function detectSourceType(content: string): SourceType {
  const firstLine = content.split("\n")[0];
  if (firstLine.startsWith("年月日")) return "smbc_bank";
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
  const content = new TextDecoder("shift-jis").decode(buffer);
  if (!content.trim()) throw new Error("ファイルが空です");

  const sourceType = detectSourceType(content);
  const parser =
    sourceType === "smbc_bank" ? new SmbcBankParser() : new SmbcCardParser();
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
