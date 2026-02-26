"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DaySpending = {
  day: number;
  daily: number;
  cumulative: number;
};

type Props = {
  data: DaySpending[];
  monthLabel: string;
  /** 当月の "今日" の日付 (1-indexed)。過去月なら undefined */
  todayDay?: number;
};

export default function CumulativeSpendingChart({ data, monthLabel, todayDay }: Props) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">累計支出 — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          今月の支出データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">累計支出 — {monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}日`}
            />
            <YAxis
              tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string) => {
                if (value == null) return ["", name];
                const label = name === "cumulative" ? "累計" : "当日";
                return [`¥${value.toLocaleString("ja-JP")}`, label];
              }}
            />
            {todayDay != null && (
              <ReferenceLine
                x={todayDay}
                stroke="#e8722a"
                strokeDasharray="4 4"
                label={{ value: "今日", fontSize: 11, fill: "#e8722a" }}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#e8722a"
              fill="#e8722a20"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
