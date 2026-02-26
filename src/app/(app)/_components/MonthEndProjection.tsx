import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

type Props = {
  currentAmount: number;
  projectedAmount: number;
  daysElapsed: number;
  daysInMonth: number;
  monthLabel: string;
};

export default function MonthEndProjection({
  currentAmount,
  projectedAmount,
  daysElapsed,
  daysInMonth,
  monthLabel,
}: Props) {
  const progress = Math.min(Math.round((daysElapsed / daysInMonth) * 100), 100);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          月末着地予測 — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            {daysElapsed}日経過 / {daysInMonth}日中（{progress}%）
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-orange-400 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">現在の支出</p>
            <p className="text-xl font-bold">
              ¥{currentAmount.toLocaleString("ja-JP")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">月末予測</p>
            <p className="text-xl font-bold text-orange-500">
              ¥{projectedAmount.toLocaleString("ja-JP")}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          ※ 現在のペースで推移した場合の試算
        </p>
      </CardContent>
    </Card>
  );
}
