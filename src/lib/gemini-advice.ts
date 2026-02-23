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
    name: "getLoansOverview",
    description:
      "全ローンの概要を取得する。各ローンの残高（未払いスケジュール合計）・次回返済日・完済予定日を返す。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getIncomeExpenseSummary",
    description:
      "指定した年月の収入・支出・収支差額を取得する。収支バランスの把握に使う。",
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
    name: "getUnsettledSharedExpenses",
    description:
      "未精算の共有費（isShared=true かつ settlementDate=null）の合計と明細を返す。期間フィルタなし。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "getTopPurchasedProducts",
    description:
      "よく購入する商品の上位N件を返す。購入回数・最新単価・最終購入日を集計。",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "取得件数（デフォルト: 10）",
          nullable: true,
        },
      },
      required: [],
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
  | "getSharedExpenses"
  | "getLoansOverview"
  | "getIncomeExpenseSummary"
  | "getUnsettledSharedExpenses"
  | "getTopPurchasedProducts";

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
      const dataSourceIds = args.dataSourceIds as number[] | undefined;
      const { start, end } = buildDateRange(year, month);

      const transactions = await prisma.transaction.findMany({
        where: {
          isShared: true,
          type: "expense",
          usageDate: { gte: start, lt: end },
          ...buildDataSourceFilter(dataSourceIds),
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

    case "getLoansOverview": {
      const loans = await prisma.loan.findMany({
        include: { schedules: { orderBy: { dueDate: "asc" } } },
        orderBy: { startDate: "asc" },
      });

      const overview = loans.map((loan) => {
        const unpaidSchedules = loan.schedules.filter(
          (s) => s.status === "unpaid"
        );
        const remainingBalance = unpaidSchedules.reduce(
          (sum, s) => sum + s.amount,
          0
        );
        const nextPayment = unpaidSchedules[0] ?? null;
        const lastSchedule =
          loan.schedules[loan.schedules.length - 1] ?? null;

        return {
          id: loan.id,
          name: loan.name,
          totalAmount: loan.totalAmount,
          startDate: loan.startDate.toISOString().split("T")[0],
          endDate: loan.endDate.toISOString().split("T")[0],
          remainingBalance,
          paidCount: loan.schedules.length - unpaidSchedules.length,
          totalCount: loan.schedules.length,
          nextPaymentDate: nextPayment
            ? nextPayment.dueDate.toISOString().split("T")[0]
            : null,
          nextPaymentAmount: nextPayment?.amount ?? null,
          completionDate: lastSchedule
            ? lastSchedule.dueDate.toISOString().split("T")[0]
            : null,
        };
      });

      return { loans: overview };
    }

    case "getIncomeExpenseSummary": {
      const year = args.year as number;
      const month = args.month as number;
      const dataSourceIds = args.dataSourceIds as number[] | undefined;
      const { start, end } = buildDateRange(year, month);

      const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            type: "income",
            usageDate: { gte: start, lt: end },
            ...buildDataSourceFilter(dataSourceIds),
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.transaction.aggregate({
          where: {
            type: "expense",
            usageDate: { gte: start, lt: end },
            ...buildDataSourceFilter(dataSourceIds),
          },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalIncome = incomeAgg._sum.amount ?? 0;
      const totalExpense = expenseAgg._sum.amount ?? 0;

      return {
        year,
        month,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount: incomeAgg._count,
        expenseCount: expenseAgg._count,
      };
    }

    case "getUnsettledSharedExpenses": {
      const transactions = await prisma.transaction.findMany({
        where: {
          isShared: true,
          type: "expense",
          settlementDate: null,
        },
        include: { category: true },
        orderBy: { usageDate: "desc" },
      });

      const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const items = transactions.map((tx) => ({
        description: tx.description,
        amount: tx.amount,
        category: tx.category?.name ?? "未分類",
        usageDate: tx.usageDate.toISOString().split("T")[0],
      }));

      return { totalUnsettled: total, count: transactions.length, items };
    }

    case "getTopPurchasedProducts": {
      const limit = (args.limit as number | undefined) ?? 10;

      const products = await prisma.productMaster.findMany({
        include: {
          receiptItems: {
            include: {
              transaction: { select: { usageDate: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      const ranked = products
        .filter((p) => p.receiptItems.length > 0)
        .map((p) => {
          const count = p.receiptItems.length;
          const latest = p.receiptItems[0];
          const latestUnitPrice =
            latest.quantity > 0
              ? Math.round(latest.price / latest.quantity)
              : latest.price;
          const lastPurchaseDate =
            latest.transaction.usageDate.toISOString().split("T")[0];

          return {
            id: p.id,
            name: p.name,
            unit: p.unit,
            purchaseCount: count,
            latestUnitPrice,
            lastPurchaseDate,
          };
        })
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, limit);

      return { products: ranked };
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
