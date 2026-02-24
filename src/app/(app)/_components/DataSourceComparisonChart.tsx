"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DataSourceComparisonItem = {
  name: string;
  current: number;
  previous: number;
};

type Props = {
  data: DataSourceComparisonItem[];
  monthLabel: string;
  prevMonthLabel: string;
};

export default function DataSourceComparisonChart({
  data,
  monthLabel,
  prevMonthLabel,
}: Props) {
  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">決済手段別前月比</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          比較データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">決済手段別前月比</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
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
                const label = name === "current" ? monthLabel : prevMonthLabel;
                return [`¥${value.toLocaleString("ja-JP")}`, label];
              }}
            />
            <Legend
              formatter={(value) => (value === "current" ? monthLabel : prevMonthLabel)}
            />
            <Bar dataKey="previous" fill="#d1d5db" radius={[3, 3, 0, 0]} />
            <Bar dataKey="current" fill="#e8722a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
