import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  totalExpense: number;
  monthLabel: string;
};

export default function MonthlyExpenseSummary({
  totalExpense,
  monthLabel,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{monthLabel}の支出合計</CardDescription>
        <CardTitle className="text-3xl">
          ¥{totalExpense.toLocaleString("ja-JP")}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
