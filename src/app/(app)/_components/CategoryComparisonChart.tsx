"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CategoryComparisonItem = {
  name: string;
  current: number;
  previous: number;
};

type Props = {
  data: CategoryComparisonItem[];
  monthLabel: string;
  prevMonthLabel: string;
};

const PX_PER_CHAR = 13;

export default function CategoryComparisonChart({
  data,
  monthLabel,
  prevMonthLabel,
}: Props) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">カテゴリ別前月比</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          比較データがありません
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.current - a.current);
  const chartHeight = Math.max(160, sorted.length * 44);
  const maxLabelChars = Math.max(...sorted.map((d) => [...d.name].length));
  const yAxisWidth = Math.max(48, maxLabelChars * PX_PER_CHAR + 4);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">カテゴリ別前月比</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string) => {
                if (value == null) return ["", name];
                const label = name === "current" ? monthLabel : prevMonthLabel;
                return [`¥${value.toLocaleString("ja-JP")}`, label];
              }}
            />
            <Legend
              formatter={(value) => (value === "current" ? monthLabel : prevMonthLabel)}
            />
            <Bar dataKey="previous" fill="#d1d5db" radius={[0, 3, 3, 0]} />
            <Bar dataKey="current" fill="#e8722a" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
