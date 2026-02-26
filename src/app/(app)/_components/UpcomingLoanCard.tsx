import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export type LoanMonthGroup = {
  label: string;
  isCurrent: boolean;
  schedules: {
    id: number;
    loanName: string;
    amount: number;
    status: "paid" | "unpaid";
  }[];
};

type Props = {
  months: LoanMonthGroup[];
};

export default function UpcomingLoanCard({ months }: Props) {
  const hasAny = months.some((m) => m.schedules.length > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>ローン返済状況</CardDescription>
        <CardTitle className="text-base">過去3ヶ月の返済</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">返済スケジュールがありません</p>
        ) : (
          months.map((month) => (
            <div key={month.label}>
              <p className={`text-xs font-semibold mb-1.5 ${month.isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                {month.label}{month.isCurrent && " (今月)"}
              </p>
              {month.schedules.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-1">スケジュールなし</p>
              ) : (
                <ul className="space-y-1">
                  {month.schedules.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      {s.status === "paid" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0" style={{ color: "var(--app-accent)" }} />
                      )}
                      <span className={`flex-1 truncate ${s.status === "paid" ? "text-muted-foreground" : ""}`}>
                        {s.loanName}
                      </span>
                      <span className={`tabular-nums text-xs ${s.status === "paid" ? "text-muted-foreground" : "font-medium"}`}>
                        ¥{s.amount.toLocaleString("ja-JP")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
        <Link href="/loans" className="text-sm text-primary hover:underline block pt-1">
          ローン管理へ →
        </Link>
      </CardContent>
    </Card>
  );
}
