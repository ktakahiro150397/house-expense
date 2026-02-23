import { prisma } from "@/lib/prisma";

// ============================================================
// Gemini Function Calling 定義（家計アドバイス用）
// ============================================================

export const adviceFunctionDeclarations = [
  {
    name: "getMonthlyExpenses",
    description:
      "指定した年月の支出合計を取得する。収入・振替は除外し支出のみ集計。",
    parameters: {
      type: "object",
      properties: {
        year: { type: "integer", description: "年（例: 2026）" },
        month: { type: "integer", description: "月（1〜12）" },
        dataSourceIds: {
          type: "array",
          items: { type: "integer" },
          description:
            "対象データソースID一覧（省略時は全データソース）",
          nullable: true,
        },
      },
      required: ["year", "month"],
    },
  },
  {
    name: "getCategoryBreakdown",
    description:
      "指定した年月のカテゴリ別支出内訳を取得する。カテゴリ名と金額の一覧を返す。",
    parameters: {
      type: "object",
      properties: {
        year: { type: "integer", description: "年（例: 2026）" },
        month: { type: "integer", description: "月（1〜12）" },
        dataSourceIds: {
          type: "array",
          items: { type: "integer" },
          description: "対象データソースID一覧（省略時は全データソース）",
          nullable: true,
        },
      },
      required: ["year", "month"],
    },
  },
  {
    name: "compareMonthlyExpenses",
    description:
      "複数月の支出合計を並べて比較する。前月比などの比較分析に使う。",
    parameters: {
      type: "object",
      properties: {
        months: {
          type: "array",
          items: { type: "string" },
          description: "比較する年月のリスト（例: [\"2026-01\", \"2026-02\"]）",
        },
        dataSourceIds: {
          type: "array",
          items: { type: "integer" },
          description: "対象データソースID一覧（省略時は全データソース）",
          nullable: true,
        },
      },
      required: ["months"],
    },
  },
  {
    name: "getTopDescriptions",
    description:
      "指定した年月の支出を摘要（店名・品目）別に集計し、上位N件を返す。",
    parameters: {
      type: "object",
      properties: {
        year: { type: "integer", description: "年（例: 2026）" },
        month: { type: "integer", description: "月（1〜12）" },
        limit: {
          type: "integer",
          description: "取得件数（デフォルト: 10）",
          nullable: true,
        },
        dataSourceIds: {
          type: "array",
          items: { type: "integer" },
          description: "対象データソースID一覧（省略時は全データソース）",
          nullable: true,
        },
      },
      required: ["year", "month"],
    },
  },
  {
    name: "getSharedExpenses",
    description:
      "指定した年月の共有費（isShared=true）の合計と明細一覧を取得する。",
    parameters: {
      type: "object",
      properties: {
        year: { type: "integer", description: "年（例: 2026）" },
        month: { type: "integer", description: "月（1〜12）" },
      },
      required: ["year", "month"],
    },
  },
] as const;

// ============================================================
// 関数名の型
// ============================================================
export type AdviceFunctionName =
  | "getMonthlyExpenses"
  | "getCategoryBreakdown"
  | "compareMonthlyExpenses"
  | "getTopDescriptions"
  | "getSharedExpenses";

// ============================================================
// DB クエリ実装
// ============================================================

function buildDateRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function buildDataSourceFilter(dataSourceIds?: number[] | null) {
  if (!dataSourceIds || dataSourceIds.length === 0) return {};
  return { dataSourceId: { in: dataSourceIds } };
}

export async function callAdviceFunction(
  name: AdviceFunctionName,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "getMonthlyExpenses": {
      const year = args.year as number;
      const month = args.month as number;
      const dataSourceIds = args.dataSourceIds as number[] | undefined;
      const { start, end } = buildDateRange(year, month);

      const agg = await prisma.transaction.aggregate({
        where: {
          type: "expense",
          usageDate: { gte: start, lt: end },
          ...buildDataSourceFilter(dataSourceIds),
        },
        _sum: { amount: true },
        _count: true,
      });

      return {
        year,
        month,
        totalExpense: agg._sum.amount ?? 0,
        transactionCount: agg._count,
      };
    }

    case "getCategoryBreakdown": {
      const year = args.year as number;
      const month = args.month as number;
      const dataSourceIds = args.dataSourceIds as number[] | undefined;
      const { start, end } = buildDateRange(year, month);

      const transactions = await prisma.transaction.findMany({
        where: {
          type: "expense",
          usageDate: { gte: start, lt: end },
          ...buildDataSourceFilter(dataSourceIds),
        },
        include: { category: true },
      });

      const map = new Map<string, number>();
      for (const tx of transactions) {
        const key = tx.category?.name ?? "未分類";
        map.set(key, (map.get(key) ?? 0) + tx.amount);
      }

      const breakdown = Array.from(map.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      return { year, month, breakdown };
    }

    case "compareMonthlyExpenses": {
      const months = args.months as string[];
      const dataSourceIds = args.dataSourceIds as number[] | undefined;

      const results = await Promise.all(
        months.map(async (ym) => {
          const [y, m] = ym.split("-").map(Number);
          const { start, end } = buildDateRange(y, m);
          const agg = await prisma.transaction.aggregate({
            where: {
              type: "expense",
              usageDate: { gte: start, lt: end },
              ...buildDataSourceFilter(dataSourceIds),
            },
            _sum: { amount: true },
          });
          return { month: ym, totalExpense: agg._sum.amount ?? 0 };
        })
      );

      return { comparison: results };
    }

    case "getTopDescriptions": {
      const year = args.year as number;
      const month = args.month as number;
      const limit = (args.limit as number | undefined) ?? 10;
      const dataSourceIds = args.dataSourceIds as number[] | undefined;
      const { start, end } = buildDateRange(year, month);

      const transactions = await prisma.transaction.findMany({
        where: {
          type: "expense",
          usageDate: { gte: start, lt: end },
          ...buildDataSourceFilter(dataSourceIds),
        },
        select: { description: true, amount: true },
      });

      const map = new Map<string, number>();
      for (const tx of transactions) {
        map.set(tx.description, (map.get(tx.description) ?? 0) + tx.amount);
      }

      const top = Array.from(map.entries())
        .map(([description, amount]) => ({ description, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);

      return { year, month, top };
    }

    case "getSharedExpenses": {
      const year = args.year as number;
      const month = args.month as number;
      const { start, end } = buildDateRange(year, month);

      const transactions = await prisma.transaction.findMany({
        where: {
          isShared: true,
          type: "expense",
          usageDate: { gte: start, lt: end },
        },
        include: { category: true },
        orderBy: { amount: "desc" },
      });

      const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const items = transactions.map((tx) => ({
        description: tx.description,
        amount: tx.amount,
        category: tx.category?.name ?? "未分類",
      }));

      return { year, month, totalShared: total, items };
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
