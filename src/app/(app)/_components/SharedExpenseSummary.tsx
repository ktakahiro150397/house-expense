import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  sharedAmount: number;
  personalAmount: number;
};

export default function SharedExpenseSummary({ sharedAmount, personalAmount }: Props) {
  const total = sharedAmount + personalAmount;
  const sharedRate = total > 0 ? Math.round((sharedAmount / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>共有費サマリー</CardDescription>
        <CardTitle className="text-base">今月の精算対象</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-2xl font-bold">
            ¥{sharedAmount.toLocaleString("ja-JP")}
          </p>
          <p className="text-xs text-muted-foreground">支出全体の {sharedRate}%</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2">
          <div>
            <p className="text-xs text-muted-foreground">共有費</p>
            <p className="font-medium">¥{sharedAmount.toLocaleString("ja-JP")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">個人費</p>
            <p className="font-medium">¥{personalAmount.toLocaleString("ja-JP")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
