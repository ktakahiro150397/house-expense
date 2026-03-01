import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MonthlyHeader from "./_components/MonthlyHeader";
import DataSourceFilter from "./_components/DataSourceFilter";
import MonthlyClientShell from "./_components/MonthlyClientShell";

export type ChartEntry = {
  categoryId: number | null;
  name: string;
  amount: number;
  percentage: number;
};

export type TransactionItem = {
  id: number;
  usageDate: Date;
  amount: number;
  description: string;
  type: string;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  dataSource: { id: number; name: string } | null;
};

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; dataSources?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { year, month, dataSources } = await searchParams;

  const dsIds = dataSources
    ? dataSources.split(",").map(Number).filter((n) => !isNaN(n) && n > 0)
    : [];

  // year/month が両方指定済みならクエリ不要。未指定時のみ最新日付を取得
  let resolvedYear: number;
  let resolvedMonth: number;
  if (year && month) {
    resolvedYear = parseInt(year, 10);
    resolvedMonth = parseInt(month, 10);
  } else {
    const latestTx = await prisma.transaction.findFirst({
      orderBy: { usageDate: "desc" },
      select: { usageDate: true },
    });
    const d = latestTx?.usageDate ?? new Date();
    resolvedYear = year ? parseInt(year, 10) : d.getFullYear();
    resolvedMonth = month ? parseInt(month, 10) : d.getMonth() + 1;
  }

  const start = new Date(resolvedYear, resolvedMonth - 1, 1);
  const end = new Date(resolvedYear, resolvedMonth, 1);

  const [transactions, allDataSources] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        usageDate: { gte: start, lt: end },
        type: { not: "transfer" },
        ...(dsIds.length > 0 ? { dataSourceId: { in: dsIds } } : {}),
      },
      select: {
        id: true,
        usageDate: true,
        amount: true,
        description: true,
        type: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        dataSource: { select: { id: true, name: true } },
      },
      orderBy: { usageDate: "desc" },
    }),
    prisma.dataSource.findMany({ orderBy: { name: "asc" } }),
  ]);

  const expenseTransactions = transactions.filter(
    (t) => t.type === "expense" && t.amount > 0
  );
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const amountByCategory = new Map<number | null, { name: string; amount: number }>();
  for (const t of expenseTransactions) {
    const key = t.categoryId;
    const current = amountByCategory.get(key) ?? {
      name: t.category?.name ?? "未分類",
      amount: 0,
    };
    amountByCategory.set(key, { name: current.name, amount: current.amount + t.amount });
  }

  const chartData: ChartEntry[] = [...amountByCategory.entries()]
    .map(([categoryId, { name, amount }]) => ({
      categoryId,
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">月別サマリー</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">{transactions.length} 件</span>
          {totalExpense > 0 && (
            <span className="font-medium text-destructive">
              支出合計: ¥{totalExpense.toLocaleString()}
            </span>
          )}
          {totalIncome > 0 && (
            <span className="font-medium text-green-600">
              収入合計: ¥{totalIncome.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <MonthlyHeader
          year={resolvedYear}
          month={resolvedMonth}
          dataSources={dataSources ?? ""}
        />
        <DataSourceFilter
          allDataSources={allDataSources}
          selectedIds={dsIds}
          year={resolvedYear}
          month={resolvedMonth}
        />
      </div>
      <MonthlyClientShell chartData={chartData} transactions={transactions} />
    </div>
  );
}
