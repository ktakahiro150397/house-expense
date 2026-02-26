import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TransactionFilters from "./_components/TransactionFilters";
import TransactionTable from "./_components/TransactionTable";
import CsvDownloadButton from "./_components/CsvDownloadButton";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    monthFrom?: string;
    monthTo?: string;
    categoryIds?: string;
    type?: string;
    dataSourceId?: string;
    isShared?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { monthFrom, monthTo, categoryIds, type, dataSourceId, isShared } =
    await searchParams;

  const allDates = await prisma.transaction.findMany({
    select: { usageDate: true },
    orderBy: { usageDate: "desc" },
  });

  const months = [
    ...new Set(allDates.map((d) => d.usageDate.toISOString().slice(0, 7))),
  ];

  const defaultMonth = months[0] ?? "";
  const resolvedFrom = monthFrom ?? defaultMonth;
  const resolvedTo =
    monthTo && monthTo >= resolvedFrom ? monthTo : resolvedFrom;

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
  if (resolvedFrom) {
    const [fy, fm] = resolvedFrom.split("-").map(Number);
    start = new Date(fy, fm - 1, 1);

    const [ty, tm] = resolvedTo.split("-").map(Number);
    end = new Date(ty, tm, 1);
  }

  const [transactions, categories, dataSources] = await Promise.all([
    prisma.transaction.findMany({
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
      },
      include: {
        category: { select: { id: true, name: true } },
        dataSource: { select: { id: true, name: true } },
        receiptItems: {
          select: { id: true, name: true, price: true, quantity: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { usageDate: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { seq: "asc" },
      select: { id: true, name: true },
    }),
    prisma.dataSource.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">明細一覧</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {transactions.length} 件
          </span>
          {totalExpense > 0 && (
            <span className="text-sm font-medium text-destructive">
              支出合計: ¥{totalExpense.toLocaleString()}
            </span>
          )}
          {totalIncome > 0 && (
            <span className="text-sm font-medium text-green-600">
              収入合計: ¥{totalIncome.toLocaleString()}
            </span>
          )}
          <Suspense>
            <CsvDownloadButton />
          </Suspense>
        </div>
      </div>
      <Suspense>
        <TransactionFilters
          months={months}
          monthFrom={resolvedFrom}
          monthTo={resolvedTo}
          categories={categories}
          selectedCategoryIds={categoryIdList}
          selectedType={type ?? ""}
          dataSources={dataSources}
          selectedDataSourceId={dataSourceId ?? ""}
          isSharedFilter={isShared === "1"}
        />
      </Suspense>
      <TransactionTable transactions={transactions} categories={categories} />
    </div>
  );
}
