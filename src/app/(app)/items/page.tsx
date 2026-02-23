import { redirect } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProductsWithStats } from "@/lib/actions/items";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ItemsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const products = await getProductsWithStats();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Package className="size-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">品目追跡</h1>
        <Badge variant="secondary">{products.length} 件</Badge>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="size-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            登録された商品はありません。
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            レシート明細ページで品目を正規化すると、ここに表示されます。
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名</TableHead>
                <TableHead className="text-right w-28">最新単価</TableHead>
                <TableHead className="text-right w-24">購入回数</TableHead>
                <TableHead className="w-36">最終購入日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Link
                      href={`/items/${product.id}`}
                      className="font-medium hover:underline text-primary"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {product.latestUnitPrice != null
                      ? `¥${product.latestUnitPrice.toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {product.purchaseCount.toLocaleString()} 回
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.latestDate
                      ? new Date(product.latestDate).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
