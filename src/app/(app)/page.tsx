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
import WeeklyTrendChart, { type WeekData } from "./_components/WeeklyTrendChart";
import CumulativeSpendingChart, { type DaySpending } from "./_components/CumulativeSpendingChart";
import CategoryComparisonChart, { type CategoryComparisonItem } from "./_components/CategoryComparisonChart";
import TopSpendingItems from "./_components/TopSpendingItems";
import DataSourceComparisonChart from "./_components/DataSourceComparisonChart";
import MonthEndProjection from "./_components/MonthEndProjection";
import DashboardClientLayout from "./_components/DashboardClientLayout";

function getMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end   = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

function getPrevMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const end   = new Date(base.getFullYear(), base.getMonth(), 1);
  return { start, end };
}

/** day (1-indexed) → 週インデックス (0-3) */
function dayToWeekIndex(day: number): number {
  if (day <= 7)  return 0;
  if (day <= 14) return 1;
  if (day <= 21) return 2;
  return 3;
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
  const { start, end }             = getMonthRange(baseDate);
  const { start: prevStart, end: prevEnd } = getPrevMonthRange(baseDate);
  const monthLabel     = `${baseDate.getFullYear()}年${baseDate.getMonth() + 1}月`;
  const prevMonthLabel = `${prevStart.getFullYear()}年${prevStart.getMonth() + 1}月`;

  // 直近5ヶ月レンジ
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
    // 新規クエリ
    currentMonthTransactions,
    prevCategoryGrouped,
    prevDataSourceGrouped,
    topItemsRaw,
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
    // カテゴリ別支出（当月）
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // カテゴリ一覧
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
    // DataSource 別支出合計（当月）
    prisma.transaction.groupBy({
      by: ["dataSourceId"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    // DataSource 名一覧
    prisma.dataSource.findMany({ select: { id: true, name: true } }),
    // 【新規】当月の日別支出明細（週別・累計グラフ用）
    prisma.transaction.findMany({
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      select: { usageDate: true, amount: true },
      orderBy: { usageDate: "asc" },
    }),
    // 【新規】前月カテゴリ別支出（前月比グラフ用）
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "expense", usageDate: { gte: prevStart, lt: prevEnd } },
      _sum: { amount: true },
    }),
    // 【新規】前月 DataSource 別支出（前月比グラフ用）
    prisma.transaction.groupBy({
      by: ["dataSourceId"],
      where: { type: "expense", usageDate: { gte: prevStart, lt: prevEnd } },
      _sum: { amount: true },
    }),
    // 【新規】当月 description 別支出上位10件
    prisma.transaction.groupBy({
      by: ["description"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { description: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
  ]);

  // ---- 既存データ整形 ----
  const recentMonths: MonthExpense[] = recentMonthsRaw;
  const totalExpense = recentMonths.find((m) => m.isCurrent)?.amount ?? 0;

  const categoryMap  = new Map(categories.map((c) => [c.id, c.name]));
  const categoryData = grouped
    .map((g) => ({
      name:   g.categoryId != null ? (categoryMap.get(g.categoryId) ?? "不明") : "未分類",
      amount: g._sum.amount ?? 0,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const prevExpense = prevExpenseResult._sum.amount ?? 0;

  const typeMap  = new Map(typeGrouped.map((g) => [g.type, g._sum.amount ?? 0]));
  const income   = typeMap.get("income")   ?? 0;
  const expense  = typeMap.get("expense")  ?? 0;
  const transfer = typeMap.get("transfer") ?? 0;

  const sharedMap     = new Map(sharedGrouped.map((g) => [g.isShared, g._sum.amount ?? 0]));
  const sharedAmount  = sharedMap.get(true)  ?? 0;
  const personalAmount = sharedMap.get(false) ?? 0;

  const unsettledAmount = unsettledResult._sum.amount ?? 0;

  const loanMonths: LoanMonthGroup[] = [-2, -1, 0].map((offset) => {
    const monthDate     = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    const nextMonthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset + 1, 1);
    const schedules = recentLoanSchedules
      .filter((s) => s.dueDate >= monthDate && s.dueDate < nextMonthDate)
      .map((s) => ({
        id:       s.id,
        loanName: s.loan.name,
        amount:   s.amount,
        status:   s.status as "paid" | "unpaid",
      }));
    return {
      label:     `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`,
      isCurrent: offset === 0,
      schedules,
    };
  });

  const dataSourceMap  = new Map(dataSources.map((d) => [d.id, d.name]));
  const dataSourceData = dataSourceGrouped
    .map((g) => ({
      name:   g.dataSourceId != null ? (dataSourceMap.get(g.dataSourceId) ?? "不明") : "未分類",
      amount: g._sum.amount ?? 0,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // ---- 新規データ整形 ----

  // 週別支出
  const weekLabels = ["第1週", "第2週", "第3週", "第4週"];
  const weekAmounts = [0, 0, 0, 0];
  for (const t of currentMonthTransactions) {
    const day  = t.usageDate.getDate();
    const week = dayToWeekIndex(day);
    weekAmounts[week] += t.amount;
  }
  const weeklyData: WeekData[] = weekLabels.map((label, i) => ({
    label,
    amount:    weekAmounts[i],
    isCurrent: i === dayToWeekIndex(baseDate.getDate()),
  }));

  // 累計支出（日別）
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const dailyAmountMap = new Map<number, number>();
  for (const t of currentMonthTransactions) {
    const day = t.usageDate.getDate();
    dailyAmountMap.set(day, (dailyAmountMap.get(day) ?? 0) + t.amount);
  }
  const lastDataDay = currentMonthTransactions.length > 0
    ? Math.max(...currentMonthTransactions.map((t) => t.usageDate.getDate()))
    : 0;
  let cumulative = 0;
  const cumulativeData: DaySpending[] = [];
  for (let day = 1; day <= lastDataDay; day++) {
    const daily = dailyAmountMap.get(day) ?? 0;
    cumulative += daily;
    cumulativeData.push({ day, daily, cumulative });
  }

  // 今日が当月かどうかで "今日" ライン
  const today = new Date();
  const todayDay =
    today.getFullYear() === baseDate.getFullYear() &&
    today.getMonth()    === baseDate.getMonth()
      ? today.getDate()
      : undefined;

  // カテゴリ前月比
  const prevCategoryMap = new Map(
    prevCategoryGrouped.map((g) => [g.categoryId, g._sum.amount ?? 0])
  );
  const categoryComparisonData: CategoryComparisonItem[] = categories
    .map((c) => {
      const current  = grouped.find((g) => g.categoryId === c.id)?._sum.amount ?? 0;
      const previous = prevCategoryMap.get(c.id) ?? 0;
      return { name: c.name, current, previous };
    })
    .filter((d) => d.current > 0 || d.previous > 0)
    .sort((a, b) => b.current - a.current);

  // 支出上位品目
  const topItems = topItemsRaw.map((g) => ({
    description: g.description,
    amount:      g._sum.amount ?? 0,
    count:       g._count.description,
  }));

  // DataSource 前月比
  const prevDataSourceMap = new Map(
    prevDataSourceGrouped.map((g) => [g.dataSourceId, g._sum.amount ?? 0])
  );
  const allDataSourceIds = new Set([
    ...dataSourceGrouped.map((g)     => g.dataSourceId),
    ...prevDataSourceGrouped.map((g) => g.dataSourceId),
  ]);
  const dataSourceComparisonData = [...allDataSourceIds]
    .map((id) => ({
      name:     id != null ? (dataSourceMap.get(id) ?? "不明") : "未分類",
      current:  dataSourceGrouped.find((g)     => g.dataSourceId === id)?._sum.amount ?? 0,
      previous: prevDataSourceMap.get(id) ?? 0,
    }))
    .filter((d) => d.current > 0 || d.previous > 0)
    .sort((a, b) => b.current - a.current);

  // 月末着地予測
  const daysElapsed       = lastDataDay > 0 ? lastDataDay : 1;
  const projectedAmount   = Math.round((totalExpense / daysElapsed) * daysInMonth);

  // ---- ウィジェット定義（サーバーサイドでレンダリング） ----
  const widgetNodes = {
    "monthly-summary": (
      <MonthlyExpenseSummary monthLabel={monthLabel} recentMonths={recentMonths} />
    ),
    "category-chart": (
      <CategoryPieChart data={categoryData} />
    ),
    "month-comparison": (
      <MonthComparisonCard
        currentAmount={totalExpense}
        previousAmount={prevExpense}
        monthLabel={monthLabel}
      />
    ),
    "income-expense": (
      <IncomeExpenseBalance income={income} expense={expense} transfer={transfer} />
    ),
    "shared-expense": (
      <SharedExpenseSummary sharedAmount={sharedAmount} personalAmount={personalAmount} />
    ),
    "unsettled": (
      <UnsettledAmountCard unsettledAmount={unsettledAmount} />
    ),
    "upcoming-loan": (
      <UpcomingLoanCard months={loanMonths} />
    ),
    "datasource-chart": (
      <DataSourceBreakdownChart data={dataSourceData} />
    ),
    "weekly-trend": (
      <WeeklyTrendChart data={weeklyData} monthLabel={monthLabel} />
    ),
    "cumulative-spending": (
      <CumulativeSpendingChart
        data={cumulativeData}
        monthLabel={monthLabel}
        todayDay={todayDay}
      />
    ),
    "category-comparison": (
      <CategoryComparisonChart
        data={categoryComparisonData}
        monthLabel={monthLabel}
        prevMonthLabel={prevMonthLabel}
      />
    ),
    "top-items": (
      <TopSpendingItems items={topItems} monthLabel={monthLabel} />
    ),
    "datasource-comparison": (
      <DataSourceComparisonChart
        data={dataSourceComparisonData}
        monthLabel={monthLabel}
        prevMonthLabel={prevMonthLabel}
      />
    ),
    "month-end-projection": (
      <MonthEndProjection
        currentAmount={totalExpense}
        projectedAmount={projectedAmount}
        daysElapsed={daysElapsed}
        daysInMonth={daysInMonth}
        monthLabel={monthLabel}
      />
    ),
  } as const;

  return (
    <div className="space-y-8">
      <DashboardClientLayout widgets={widgetNodes} />

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
          {quickLinks.map(({ label, description, icon: Icon, href, implemented }) => {
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
                    <p className="text-xs text-muted-foreground mt-1">未実装</p>
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
          })}
        </div>
      </div>
    </div>
  );
}
