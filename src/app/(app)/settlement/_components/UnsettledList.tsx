import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Transaction = {
  id: number;
  usageDate: Date;
  amount: number;
  description: string;
  userId: number;
  user: { id: number; name: string | null; email: string };
  category: { id: number; name: string } | null;
};

function formatDate(d: Date): string {
  const date = new Date(d);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function UnsettledList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">
        未精算リスト（{transactions.length} 件）
      </h2>

      {/* モバイル: カード形式 */}
      <div className="md:hidden space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="rounded-lg border bg-card p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(tx.usageDate)}
              </span>
              <span className="font-mono font-semibold text-sm">
                ¥{tx.amount.toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-medium truncate">{tx.description}</p>
            <div className="flex items-center justify-between gap-2">
              <div>
                {tx.category ? (
                  <Badge variant="secondary" className="text-xs">{tx.category.name}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">未分類</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {tx.user.name ?? tx.user.email}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* PC: テーブル形式 */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">日付</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead className="whitespace-nowrap">カテゴリ</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                金額
              </TableHead>
              <TableHead className="whitespace-nowrap">支払者</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(tx.usageDate)}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {tx.description}
                </TableCell>
                <TableCell>
                  {tx.category ? (
                    <Badge variant="secondary">{tx.category.name}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">未分類</span>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm">
                  ¥{tx.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {tx.user.name ?? tx.user.email}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
