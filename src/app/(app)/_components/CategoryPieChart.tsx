"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CHART_COLORS = ["#e8722a", "#2aa4a4", "#3a5a7a", "#c9a832", "#c47a1a"];

type Props = {
  data: { name: string; amount: number }[];
};

export default function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別支出</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          今月の支出データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">カテゴリ別支出</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) =>
                value != null ? `¥${value.toLocaleString("ja-JP")}` : ""
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
