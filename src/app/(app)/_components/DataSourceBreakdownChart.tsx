"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccentColor } from "@/components/AccentColorProvider";

const BASE_COLORS = ["#2aa4a4", "#3a5a7a", "#c9a832", "#c47a1a"];

type Props = {
  data: { name: string; amount: number }[];
};

export default function DataSourceBreakdownChart({ data }: Props) {
  const { accentColor } = useAccentColor();
  const CHART_COLORS = [accentColor, ...BASE_COLORS];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">データソース別支出</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          データソース別データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">データソース別支出</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number | undefined) => value != null ? [`¥${value.toLocaleString("ja-JP")}`, "支出"] : ["", "支出"]}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
