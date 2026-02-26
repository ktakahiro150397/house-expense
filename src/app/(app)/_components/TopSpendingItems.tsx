import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TopItem = {
  description: string;
  amount: number;
  count: number;
};

type Props = {
  items: TopItem[];
  monthLabel: string;
};

export default function TopSpendingItems({ items, monthLabel }: Props) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">支出上位品目 — {monthLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            今月の支出データがありません
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5 shrink-0 text-right">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.description}</p>
                  {item.count > 1 && (
                    <p className="text-xs text-muted-foreground">{item.count}件の合計</p>
                  )}
                </div>
                <p className="text-sm font-semibold shrink-0">
                  ¥{item.amount.toLocaleString("ja-JP")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
