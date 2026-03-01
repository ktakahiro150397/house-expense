import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  expense: "支出",
  income: "収入",
  transfer: "振替",
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const monthFrom = searchParams.get("monthFrom") ?? "";
  const monthTo = searchParams.get("monthTo") ?? "";
  const categoryIds = searchParams.get("categoryIds") ?? "";
  const type = searchParams.get("type") ?? "";
  const dataSourceId = searchParams.get("dataSourceId") ?? "";
  const isShared = searchParams.get("isShared") ?? "";
  const keyword = searchParams.get("keyword") ?? "";

  const categoryIdList = categoryIds
    ? categoryIds
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n >= 0)
    : [];
  const includeUncategorized = categoryIdList.includes(0);
  const realCategoryIds = categoryIdList.filter((n) => n > 0);

  const parsedDataSourceId =
    dataSourceId && !isNaN(Number(dataSourceId)) && Number(dataSourceId) > 0
      ? Number(dataSourceId)
      : undefined;

  let start: Date | undefined;
  let end: Date | undefined;
  if (monthFrom) {
    const [fy, fm] = monthFrom.split("-").map(Number);
    start = new Date(fy, fm - 1, 1);
    const resolvedTo = monthTo && monthTo >= monthFrom ? monthTo : monthFrom;
    const [ty, tm] = resolvedTo.split("-").map(Number);
    end = new Date(ty, tm, 1);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(start && end ? { usageDate: { gte: start, lt: end } } : {}),
      ...(categoryIdList.length > 0
        ? {
            OR: [
              ...(realCategoryIds.length > 0
                ? [{ categoryId: { in: realCategoryIds } }]
                : []),
              ...(includeUncategorized ? [{ categoryId: null }] : []),
            ],
          }
        : {}),
      ...(type ? { type } : {}),
      ...(parsedDataSourceId ? { dataSourceId: parsedDataSourceId } : {}),
      ...(isShared === "1" ? { isShared: true } : {}),
      ...(keyword ? { description: { contains: keyword } } : {}),
    },
    include: {
      category: { select: { name: true } },
      dataSource: { select: { name: true } },
    },
    orderBy: { usageDate: "desc" },
  });

  const header = ["日付", "説明", "データソース", "種別", "カテゴリ", "金額", "共有"];
  const rows = transactions.map((t) => {
    const date = new Date(t.usageDate);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
    return [
      escapeCsv(dateStr),
      escapeCsv(t.description),
      escapeCsv(t.dataSource?.name ?? ""),
      escapeCsv(TYPE_LABEL[t.type] ?? t.type),
      escapeCsv(t.category?.name ?? "未分類"),
      escapeCsv(t.type === "expense" ? -Math.abs(t.amount) : t.amount),
      escapeCsv(t.isShared ? "はい" : "いいえ"),
    ].join(",");
  });

  const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions.csv"`,
    },
  });
}
