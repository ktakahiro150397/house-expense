import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  unsettledAmount: number;
};

export default function UnsettledAmountCard({ unsettledAmount }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>未精算金額</CardDescription>
        <CardTitle className="text-base">精算待ちの共有費</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-2xl font-bold ${unsettledAmount > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
          ¥{unsettledAmount.toLocaleString("ja-JP")}
        </p>
        <Link
          href="/settlement"
          className="text-sm text-primary hover:underline"
        >
          精算へ →
        </Link>
      </CardContent>
    </Card>
  );
}
