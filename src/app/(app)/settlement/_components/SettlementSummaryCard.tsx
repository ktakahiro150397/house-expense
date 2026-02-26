import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SettlementResult } from "@/lib/settlement";

type Props = {
  result: SettlementResult;
  userNames: Map<number, string>;
};

export default function SettlementSummaryCard({ result, userNames }: Props) {
  const { userTotals, morePayerUserId, lessPayerUserId, difference } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle>精算サマリー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ユーザー別合計 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from(userTotals.entries()).map(([userId, total]) => (
            <div key={userId} className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {userNames.get(userId) ?? `ユーザー${userId}`}
              </p>
              <p className="text-xl font-bold">¥{total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* 差額の結論 */}
        <div className="rounded-lg bg-muted p-4 text-center">
          {difference === 0 ? (
            <p className="text-lg font-medium text-muted-foreground">
              精算済みです（差額なし）
            </p>
          ) : morePayerUserId && lessPayerUserId ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">支払い先</p>
              <p className="text-base font-bold leading-relaxed">
                <span className="text-primary">
                  {userNames.get(lessPayerUserId) ?? `ユーザー${lessPayerUserId}`}
                </span>
                {" → "}
                <span className="text-primary">
                  {userNames.get(morePayerUserId) ?? `ユーザー${morePayerUserId}`}
                </span>
              </p>
              <p className="text-2xl font-bold text-red-600">
                ¥{Math.floor(difference).toLocaleString()}
              </p>
            </div>
          ) : morePayerUserId ? (
            <div className="space-y-1">
              <p className="text-base font-bold">
                <span className="text-primary">
                  {userNames.get(morePayerUserId) ?? `ユーザー${morePayerUserId}`}
                </span>
                が全額負担
              </p>
              <p className="text-red-600 font-semibold">
                差額: ¥{Math.floor(difference).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
