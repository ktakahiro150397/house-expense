import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TransactionFilters from "./_components/TransactionFilters";
import TransactionTable from "./_components/TransactionTable";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; categoryId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { month, categoryId } = await searchParams;

  const allDates = await prisma.transaction.findMany({
    select: { usageDate: true },
    orderBy: { usageDate: "desc" },
  });

  const months = [
    ...new Set(allDates.map((d) => d.usageDate.toISOString().slice(0, 7))),
  ];

  const selectedMonth = month ?? months[0];

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  let start: Date | undefined;
  let end: Date | undefined;
  if (selectedMonth) {
    const [y, m] = selectedMonth.split("-").map(Number);
    start = new Date(y, m - 1, 1);
    end = new Date(y, m, 1);
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(start && end ? { usageDate: { gte: start, lt: end } } : {}),
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { usageDate: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">明細一覧</h1>
        <span className="text-sm text-muted-foreground">
          {transactions.length} 件
        </span>
      </div>
      <Suspense>
        <TransactionFilters
          months={months}
          selectedMonth={selectedMonth ?? ""}
          categories={categories}
          selectedCategoryId={categoryId ?? ""}
        />
      </Suspense>
      <TransactionTable transactions={transactions} categories={categories} />
    </div>
  );
}
