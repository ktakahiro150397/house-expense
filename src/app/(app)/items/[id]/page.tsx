import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProductMasterById, getProductPriceHistory } from "@/lib/actions/items";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PriceHistoryChart from "./_components/PriceHistoryChart";
import ProductUnitEditor from "./_components/ProductUnitEditor";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();
  const [product, history] = await Promise.all([getProductMasterById(productId), getProductPriceHistory(productId)]);
  if (!product) notFound();

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }),
    unitPrice: h.unitPrice,
  }));

  const unitSuffix = product.unit ? ` (${product.unit})` : "";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/items" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" />
          品目追跡
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <h1 className="text-base font-medium">{product.name}{unitSuffix}</h1>
        </div>
      </div>

      {/* 単位編集 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">単位:</span>
        <ProductUnitEditor productMasterId={product.id} currentUnit={product.unit} />
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          単価推移{product.unit ? ` (¥/${product.unit})` : ""}
        </h2>
        <PriceHistoryChart data={chartData} unit={product.unit} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">購入履歴</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">購入履歴がありません</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>購入日</TableHead>
                  <TableHead>店舗・明細</TableHead>
                  <TableHead className="text-right w-28">
                    単価{product.unit ? ` (¥/${product.unit})` : ""}
                  </TableHead>
                  <TableHead className="text-right w-24">
                    数量{product.unit ? ` (${product.unit})` : ""}
                  </TableHead>
                  <TableHead className="text-right w-24">小計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-sm max-w-[240px] truncate">{item.description}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ¥{item.unitPrice.toLocaleString()}{product.unit ? `/${product.unit}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm">¥{item.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
