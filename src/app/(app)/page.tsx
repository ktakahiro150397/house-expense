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
import MonthlyExpenseSummary from "./_components/MonthlyExpenseSummary";
import CategoryPieChart from "./_components/CategoryPieChart";

function getMonthRange(base: Date) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
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
    implemented: false,
  },
  {
    label: "精算管理",
    description: "パートナーとの割り勘を精算する",
    icon: Wallet,
    href: "/settlement",
    implemented: false,
  },
  {
    label: "ローン管理",
    description: "返済予定と残債務を確認する",
    icon: Building2,
    href: "/loans",
    implemented: false,
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
  const monthLabel = `${baseDate.getFullYear()}年${baseDate.getMonth() + 1}月`;

  const [aggregateResult, grouped, categories] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { type: "expense", usageDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const totalExpense = aggregateResult._sum.amount ?? 0;

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const categoryData = grouped
    .map((g) => ({
      name:
        g.categoryId != null
          ? (categoryMap.get(g.categoryId) ?? "不明")
          : "未分類",
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
            totalExpense={totalExpense}
            monthLabel={monthLabel}
          />
          <CategoryPieChart data={categoryData} />
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
