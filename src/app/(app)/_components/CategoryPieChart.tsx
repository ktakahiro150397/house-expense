"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccentColor } from "@/components/AccentColorProvider";

const BASE_COLORS = ["#2aa4a4", "#3a5a7a", "#c9a832", "#c47a1a", "#7a5a3a", "#5a7a3a"];
const MAX_ITEMS = 7;
// 日本語全角文字の概算幅(px) @font-size:12px
const PX_PER_CHAR = 13;
const RIGHT_MARGIN = 84; // "¥1,234,567" 程度が収まる幅

type Props = {
  data: { name: string; amount: number }[];
};

export default function CategoryPieChart({ data }: Props) {
  const { accentColor } = useAccentColor();
  const CHART_COLORS = [accentColor, ...BASE_COLORS];

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別支出</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          今月の支出データがありません
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  let chartData: { name: string; amount: number }[];
  if (sorted.length > MAX_ITEMS) {
    const top = sorted.slice(0, MAX_ITEMS);
    const restAmount = sorted.slice(MAX_ITEMS).reduce((sum, d) => sum + d.amount, 0);
    chartData = [...top, { name: "その他", amount: restAmount }];
  } else {
    chartData = sorted;
  }

  // ラベル幅をコンテンツに合わせて動的計算
  const maxLabelChars = Math.max(...chartData.map((d) => [...d.name].length));
  const yAxisWidth = Math.max(48, maxLabelChars * PX_PER_CHAR + 4);

  const chartHeight = Math.max(160, chartData.length * 36);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">カテゴリ別支出</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: RIGHT_MARGIN, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number | undefined) =>
                value != null ? [`¥${value.toLocaleString("ja-JP")}`, "支出"] : ["", "支出"]
              }
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
              <LabelList
                dataKey="amount"
                position="right"
                formatter={(v: unknown) =>
                  typeof v === "number" ? `¥${v.toLocaleString("ja-JP")}` : ""
                }
                style={{ fontSize: 11, fill: "#888" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
