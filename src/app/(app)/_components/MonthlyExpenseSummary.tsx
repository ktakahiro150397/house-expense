"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type MonthExpense = {
  label: string;   // "12月", "1月" など
  amount: number;
  isCurrent: boolean;
};

type Props = {
  monthLabel: string;  // "2026年2月"
  recentMonths: MonthExpense[];
};

export default function MonthlyExpenseSummary({ monthLabel, recentMonths }: Props) {
  const currentAmount = recentMonths.find((m) => m.isCurrent)?.amount ?? 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardDescription>{monthLabel}の支出合計</CardDescription>
        <CardTitle className="text-3xl">
          ¥{currentAmount.toLocaleString("ja-JP")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-xs text-muted-foreground mb-2">直近5ヶ月の推移</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={recentMonths}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: number | undefined) =>
                value != null ? [`¥${value.toLocaleString("ja-JP")}`, "支出"] : ["", "支出"]
              }
            />
            <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
              {recentMonths.map((m, i) => (
                <Cell key={i} fill={m.isCurrent ? "#e8722a" : "#d1d5db"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
