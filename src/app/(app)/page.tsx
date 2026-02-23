import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, List, Wallet, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MonthlyExpenseSummary, { type MonthExpense } from "./_components/MonthlyExpenseSummary";
import CategoryPieChart from "./_components/CategoryPieChart";
import MonthComparisonCard from "./_components/MonthComparisonCard";
import IncomeExpenseBalance from "./_components/IncomeExpenseBalance";
import SharedExpenseSummary from "./_components/SharedExpenseSummary";
import UnsettledAmountCard from "./_components/UnsettledAmountCard";
import UpcomingLoanCard, { type LoanMonthGroup } from "./_components/UpcomingLoanCard";
import DataSourceBreakdownChart from "./_components/DataSourceBreakdownChart";

function getMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

function getPrevMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const end = new Date(base.getFullYear(), base.getMonth(), 1);
  return { start, end };
}

const quickLinks = [
  {
    label: "CSVインポート",
    description: "銀行・カード明細をCSVで取り込む",
    icon: Upload,
    href: "/import",
    implemented: true,
  },
  {
    label: "明細一覧",
    description: "取り込んだ取引を確認・編集する",
    icon: List,
    href: "/transactions",
    implemented: true,
  },
  {
    label: "精算管理",
    description: "パートナーとの割り勘を精算する",
    icon: Wallet,
    href: "/settlement",
    implemented: true,
  },
  {
    label: "ローン管理",
    description: "返済予定と残債務を確認する",
    icon: Building2,
    href: "/loans",
    implemented: true,
  },
];

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "ゲスト";

  const latest = await prisma.transaction.findFirst({
    orderBy: { usageDate: "desc" },
    select: { usageDate: true },
  });
  const baseDate = latest?.usageDate ?? new Date();
  const { start, end } = getMonthRange(baseDate);
  const { start: prevStart, end: prevEnd } = getPrevMonthRange(baseDate);
  const monthLabel = `${baseDate.getFullYear()}年${baseDate.getMonth() + 1}月`;

  // 直近5ヶ月の月別レンジ（-4〜0）
  const monthRanges = [-4, -3, -2, -1, 0].map((offset) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    return {
      label: `${d.getMonth() + 1}月`,
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      isCurrent: offset === 0,
    };
  });

  const [
    recentMonthsRaw,
    grouped,
    categories,
    prevExpenseResult,
    typeGrouped,
    sharedGrouped,
    unsettledResult,
    recentLoanSchedules,
    dataSourceGrouped,
    dataSources,
  ] = await Promise.all([
    // 直近5ヶ月の支出合計（並列）
    Promise.all(
      monthRanges.map((r) =>
        prisma.transaction
          .aggregate({
            where: { type: "expense", usageDate: { gte: r.start, lt: r.end } },
            _sum: { amount: true },
          })
          .then((res) => ({
            label: r.label,
            amount: res._sum.amount ?? 0,
            isCurrent: r.isCurrent,
          }))
      )
    ),
    // 既存: カテゴリ別支出
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // 既存: カテゴリ一覧
    prisma.category.findMany({ orderBy: { seq: "asc" }, select: { id: true, name: true } }),
    // 前月支出合計
    prisma.transaction.aggregate({
      where: { type: "expense", usageDate: { gte: prevStart, lt: prevEnd } },
      _sum: { amount: true },
    }),
    // 今月 type 別合計（収支バランス）
    prisma.transaction.groupBy({
      by: ["type"],
      where: { usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // 今月 isShared 別支出合計（共有費サマリー）
    prisma.transaction.groupBy({
      by: ["isShared"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // 未精算合計
    prisma.transaction.aggregate({
      where: { type: "expense", isShared: true, settlementDate: null },
      _sum: { amount: true },
    }),
    // 過去3ヶ月のローンスケジュール
    prisma.loanSchedule.findMany({
      where: {
        dueDate: {
          gte: new Date(baseDate.getFullYear(), baseDate.getMonth() - 2, 1),
          lt: end,
        },
      },
      include: { loan: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
    }),
    // DataSource 別支出合計
    prisma.transaction.groupBy({
      by: ["dataSourceId"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // DataSource 名一覧
    prisma.dataSource.findMany({ select: { id: true, name: true } }),
  ]);

  // 直近5ヶ月データ
  const recentMonths: MonthExpense[] = recentMonthsRaw;
  const totalExpense = recentMonths.find((m) => m.isCurrent)?.amount ?? 0;
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categoryData = grouped
    .map((g) => ({
      name: g.categoryId != null ? (categoryMap.get(g.categoryId) ?? "不明") : "未分類",
      amount: g._sum.amount ?? 0,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 前月支出（MonthComparisonCard 用）
  const prevExpense = prevExpenseResult._sum.amount ?? 0;

  // 収支バランス
  const typeMap = new Map(typeGrouped.map((g) => [g.type, g._sum.amount ?? 0]));
  const income = typeMap.get("income") ?? 0;
  const expense = typeMap.get("expense") ?? 0;
  const transfer = typeMap.get("transfer") ?? 0;

  // 共有費サマリー
  const sharedMap = new Map(sharedGrouped.map((g) => [g.isShared, g._sum.amount ?? 0]));
  const sharedAmount = sharedMap.get(true) ?? 0;
  const personalAmount = sharedMap.get(false) ?? 0;

  // 未精算
  const unsettledAmount = unsettledResult._sum.amount ?? 0;

  // 過去3ヶ月のローンデータを月別にグループ化
  const loanMonths: LoanMonthGroup[] = [-2, -1, 0].map((offset) => {
    const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    const nextMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset + 1, 1);
    const schedules = recentLoanSchedules
      .filter((s) => s.dueDate >= monthDate && s.dueDate < nextMonthDate)
      .map((s) => ({
        id: s.id,
        loanName: s.loan.name,
        amount: s.amount,
        status: s.status as "paid" | "unpaid",
      }));
    return {
      label: `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`,
      isCurrent: offset === 0,
      schedules,
    };
  });

  // DataSource 別支出
  const dataSourceMap = new Map(dataSources.map((d) => [d.id, d.name]));
  const dataSourceData = dataSourceGrouped
    .map((g) => ({
      name: g.dataSourceId != null ? (dataSourceMap.get(g.dataSourceId) ?? "不明") : "未分類",
      amount: g._sum.amount ?? 0,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          直近月のサマリー
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MonthlyExpenseSummary
            monthLabel={monthLabel}
            recentMonths={recentMonths}
          />
          <CategoryPieChart data={categoryData} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          詳細サマリー
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MonthComparisonCard
            currentAmount={totalExpense}
            previousAmount={prevExpense}
            monthLabel={monthLabel}
          />
          <IncomeExpenseBalance
            income={income}
            expense={expense}
            transfer={transfer}
          />
          <SharedExpenseSummary
            sharedAmount={sharedAmount}
            personalAmount={personalAmount}
          />
          <UnsettledAmountCard unsettledAmount={unsettledAmount} />
          <UpcomingLoanCard months={loanMonths} />
          <DataSourceBreakdownChart data={dataSourceData} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            こんにちは、{name}さん
          </CardTitle>
          <CardDescription>
            家計簿アプリへようこそ。下のメニューから機能を選んでください。
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          クイックアクセス
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(
            ({ label, description, icon: Icon, href, implemented }) => {
              const content = (
                <Card
                  className={
                    implemented
                      ? "cursor-pointer transition-colors hover:bg-accent"
                      : "opacity-50 cursor-not-allowed"
                  }
                >
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{description}</CardDescription>
                    {!implemented && (
                      <p className="text-xs text-muted-foreground mt-1">
                        未実装
                      </p>
                    )}
                  </CardContent>
                </Card>
              );

              return implemented ? (
                <Link key={href} href={href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={href}>{content}</div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
