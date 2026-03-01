"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccentColor } from "@/components/AccentColorProvider";
import type { ChartEntry } from "../page";

const BASE_COLORS = [
  "#2aa4a4",
  "#3a5a7a",
  "#c9a832",
  "#c47a1a",
  "#7a5a3a",
  "#5a7a3a",
];
const PX_PER_CHAR = 13;
const RIGHT_MARGIN = 130;

type Props = {
  chartData: ChartEntry[];
  selectedCategoryId: number | null | undefined;
  onSelectCategory: (categoryId: number | null) => void;
};

export default function CategoryBreakdownChart({
  chartData,
  selectedCategoryId,
  onSelectCategory,
}: Props) {
  const { accentColor } = useAccentColor();
  const CHART_COLORS = [accentColor, ...BASE_COLORS];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別支出</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          データがありません
        </CardContent>
      </Card>
    );
  }

  const { yAxisWidth, chartHeight } = useMemo(() => {
    const maxChars = Math.max(...chartData.map((d) => [...d.name].length));
    return {
      yAxisWidth: Math.max(48, maxChars * PX_PER_CHAR + 4),
      chartHeight: Math.max(160, chartData.length * 40),
    };
  }, [chartData]);
  const hasSelection = selectedCategoryId !== undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          カテゴリ別支出
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            バーをクリックすると明細を表示
          </span>
        </CardTitle>
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
            <Bar
              dataKey="amount"
              radius={[0, 4, 4, 0]}
              onClick={(data) => onSelectCategory((data as unknown as ChartEntry).categoryId)}
              style={{ cursor: "pointer" }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  opacity={
                    hasSelection && selectedCategoryId !== entry.categoryId ? 0.35 : 1
                  }
                />
              ))}
              <LabelList
                dataKey="amount"
                content={(props) => {
                  const { x, y, width, height, value, index } = props as {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    value: number;
                    index: number;
                  };
                  if (index == null) return null;
                  const entry = chartData[index];
                  if (!entry) return null;
                  return (
                    <text
                      x={(x ?? 0) + (width ?? 0) + 4}
                      y={(y ?? 0) + (height ?? 0) / 2}
                      dominantBaseline="central"
                      fontSize={11}
                      fill="#888"
                    >
                      {`¥${entry.amount.toLocaleString("ja-JP")} (${entry.percentage}%)`}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
