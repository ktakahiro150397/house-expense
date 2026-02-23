import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  currentAmount: number;
  previousAmount: number;
  monthLabel: string;
};

export default function MonthComparisonCard({ currentAmount, previousAmount, monthLabel }: Props) {
  const diff = currentAmount - previousAmount;
  const rate = previousAmount > 0 ? Math.round((diff / previousAmount) * 100) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>前月比較</CardDescription>
        <CardTitle className="text-base">{monthLabel}の支出</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">
            ¥{currentAmount.toLocaleString("ja-JP")}
          </span>
          {diff !== 0 && (
            <span className={`text-sm font-medium mb-0.5 ${diff > 0 ? "text-red-500" : "text-green-600"}`}>
              {diff > 0 ? "▲" : "▼"} ¥{Math.abs(diff).toLocaleString("ja-JP")}
              {rate !== null && ` (${diff > 0 ? "+" : ""}${rate}%)`}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          前月: ¥{previousAmount.toLocaleString("ja-JP")}
        </p>
      </CardContent>
    </Card>
  );
}
