import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  income: number;
  expense: number;
  transfer: number;
};

export default function IncomeExpenseBalance({ income, expense, transfer }: Props) {
  const balance = income - expense;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>収支バランス</CardDescription>
        <CardTitle className="text-base">今月の収支</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
          <div>
            <p className="text-xs text-muted-foreground">収入</p>
            <p className="font-semibold text-green-600 text-sm sm:text-base">
              ¥{income.toLocaleString("ja-JP")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">支出</p>
            <p className="font-semibold text-red-500 text-sm sm:text-base">
              ¥{expense.toLocaleString("ja-JP")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">振替</p>
            <p className="font-semibold text-muted-foreground text-sm sm:text-base">
              ¥{transfer.toLocaleString("ja-JP")}
            </p>
          </div>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">収支差額</span>
            <span className={`text-lg font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
              {balance >= 0 ? "+" : ""}¥{balance.toLocaleString("ja-JP")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
