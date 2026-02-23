"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Loader2, UploadCloud, Check, ChevronsUpDown, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  updateReceiptItems,
  uploadReceiptImage,
  analyzeReceipt,
  assignProduct,
} from "@/lib/actions/receipts";

type ItemRow = {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  productMasterId?: number | null;
};

type ProductMaster = { id: number; name: string };

type Transaction = {
  id: number;
  description: string;
  receiptImageUrl: string | null;
  receiptItems: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    productMasterId: number | null;
  }>;
};

type ReanalyzePhase = "idle" | "uploading" | "uploaded" | "analyzing" | "done";

// ============================================================
// ProductCombobox: 品目正規化用 Combobox
// ============================================================
function ProductCombobox({
  receiptItemId,
  currentProductMasterId,
  productMasters,
  onAssigned,
}: {
  receiptItemId: number | undefined;
  currentProductMasterId: number | null | undefined;
  currentName: string;
  productMasters: ProductMaster[];
  onAssigned: (productMasterId: number, masterName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const currentMaster = productMasters.find((m) => m.id === currentProductMasterId);

  const filtered = productMasters.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate =
    search.trim() !== "" &&
    !productMasters.some((m) => m.name.toLowerCase() === search.trim().toLowerCase());

  function handleSelect(master: ProductMaster) {
    if (!receiptItemId) return;
    setOpen(false);
    startTransition(async () => {
      await assignProduct(receiptItemId, { productMasterId: master.id });
      onAssigned(master.id, master.name);
    });
  }

  function handleCreate() {
    if (!receiptItemId || !search.trim()) return;
    const newName = search.trim();
    setOpen(false);
    setSearch("");
    startTransition(async () => {
      await assignProduct(receiptItemId, { newName });
      onAssigned(-1, newName);
    });
  }

  if (!receiptItemId) {
    return (
      <span className="text-xs text-muted-foreground">（保存後に設定可能）</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 max-w-[160px] justify-between"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : currentMaster ? (
            <Badge variant="secondary" className="text-xs font-normal px-1">
              {currentMaster.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground truncate">品目を紐付け…</span>
          )}
          <ChevronsUpDown className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="商品名を検索…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() === "" ? "商品名を入力してください" : "該当なし"}
            </CommandEmpty>
            {filtered.length > 0 && (
              <CommandGroup heading="既存の商品">
                {filtered.map((master) => (
                  <CommandItem
                    key={master.id}
                    value={master.name}
                    onSelect={() => handleSelect(master)}
                    className="text-sm"
                  >
                    <Check
                      className={`mr-2 size-4 ${
                        currentProductMasterId === master.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {master.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading="新規登録">
                <CommandItem onSelect={handleCreate} className="text-sm gap-2">
                  <PackagePlus className="size-4" />
                  <span>「{search.trim()}」を新規登録</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// ReceiptDetailEditor（メイン）
// ============================================================
export default function ReceiptDetailEditor({
  transaction,
  productMasters: initialProductMasters,
}: {
  transaction: Transaction;
  productMasters: ProductMaster[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ItemRow[]>(
    transaction.receiptItems.map(
      ({ id, name, price, quantity, productMasterId }) => ({
        id,
        name,
        price,
        quantity,
        productMasterId,
      })
    )
  );
  const [productMasters, setProductMasters] = useState<ProductMaster[]>(
    initialProductMasters
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 再解析ダイアログ状態
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [reanalyzePhase, setReanalyzePhase] =
    useState<ReanalyzePhase>("idle");
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    transaction.receiptImageUrl
  );

  // --- 品目編集 ---

  function handleChange(
    index: number,
    field: keyof Pick<ItemRow, "name" | "price" | "quantity">,
    value: string | number
  ) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSaved(false);
  }

  function handleAddRow() {
    setRows((prev) => [...prev, { name: "", price: 0, quantity: 1 }]);
    setSaved(false);
  }

  function handleRemoveRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateReceiptItems(transaction.id, rows);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "保存に失敗しました"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleAssigned(
    index: number,
    productMasterId: number,
    masterName: string
  ) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], productMasterId };
      return next;
    });
    if (productMasterId === -1) {
      router.refresh();
    } else if (!productMasters.find((m) => m.id === productMasterId)) {
      setProductMasters((prev) =>
        [...prev, { id: productMasterId, name: masterName }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
    }
  }

  const total = rows.reduce(
    (sum, r) => sum + (Number(r.price) || 0) * (Number(r.quantity) || 0),
    0
  );

  // --- 再解析ダイアログ ---

  function openReanalyze() {
    setReanalyzePhase(currentImageUrl ? "uploaded" : "idle");
    setReanalyzeError(null);
    setReanalyzeOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReanalyzeError(null);
    setReanalyzePhase("uploading");

    const formData = new FormData();
    formData.set("file", file);

    try {
      const { receiptImageUrl } = await uploadReceiptImage(
        transaction.id,
        formData
      );
      setCurrentImageUrl(receiptImageUrl);
      setReanalyzePhase("uploaded");
    } catch (err) {
      setReanalyzeError(
        err instanceof Error ? err.message : "アップロードに失敗しました"
      );
      setReanalyzePhase("idle");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    setReanalyzeError(null);
    setReanalyzePhase("analyzing");
    try {
      const result = await analyzeReceipt(transaction.id);
      setRows(
        result.items.map(({ name, price, quantity }) => ({
          name,
          price,
          quantity,
        }))
      );
      setSaved(false);
      setReanalyzePhase("done");
    } catch (err) {
      setReanalyzeError(
        err instanceof Error ? err.message : "解析に失敗しました"
      );
      setReanalyzePhase("uploaded");
    }
  }

  function handleReanalyzeDone() {
    setReanalyzeOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 画像エリア */}
      <div className="space-y-3 max-w-sm">
        <h2 className="text-sm font-semibold">レシート画像</h2>
        {currentImageUrl ? (
          <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border bg-muted">
            <Image
              src={currentImageUrl}
              alt="レシート"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground bg-muted/30">
            <UploadCloud className="size-8" />
            <span>レシート画像未登録</span>
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={openReanalyze}>
          {currentImageUrl
            ? "別の画像で再解析する"
            : "画像をアップロードして解析する"}
        </Button>
      </div>

      {/* 品目テーブル */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">品目一覧</h2>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>品目名</TableHead>
                <TableHead>正規化商品</TableHead>
                <TableHead className="text-right w-24">単価</TableHead>
                <TableHead className="text-right w-20">数量</TableHead>
                <TableHead className="text-right w-24">小計</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-6 text-sm"
                  >
                    品目がありません
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="py-1 px-2">
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        handleChange(i, "name", e.target.value)
                      }
                      className="h-8 text-sm min-w-[120px]"
                      placeholder="品目名"
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <ProductCombobox
                      receiptItemId={row.id}
                      currentProductMasterId={row.productMasterId}
                      currentName={row.name}
                      productMasters={productMasters}
                      onAssigned={(pid, mName) =>
                        handleAssigned(i, pid, mName)
                      }
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      type="number"
                      value={row.price}
                      onChange={(e) =>
                        handleChange(i, "price", Number(e.target.value))
                      }
                      className="h-8 text-sm text-right w-24"
                      min={0}
                    />
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <Input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        handleChange(i, "quantity", Number(e.target.value))
                      }
                      className="h-8 text-sm text-right w-20"
                      min={1}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono py-1 px-2 whitespace-nowrap">
                    ¥
                    {(
                      (Number(row.price) || 0) * (Number(row.quantity) || 0)
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-1 px-1">
                    <button
                      onClick={() => handleRemoveRow(i)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="削除"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={4} className="py-2 px-2 text-sm">
                  合計
                </TableCell>
                <TableCell className="text-right text-sm font-mono py-2 px-2 whitespace-nowrap">
                  ¥{total.toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="gap-1"
        >
          <Plus className="size-4" />
          行を追加
        </Button>

        {saveError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded p-2">
            {saveError}
          </p>
        )}

        <div className="flex items-center gap-2 justify-end">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="size-4" />
              保存しました
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[96px]"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1" />
                保存中…
              </>
            ) : (
              "保存する"
            )}
          </Button>
        </div>
      </div>

      {/* 再解析ダイアログ */}
      <Dialog open={reanalyzeOpen} onOpenChange={setReanalyzeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentImageUrl
                ? "別の画像で再解析する"
                : "画像をアップロードして解析する"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {reanalyzeError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">
                {reanalyzeError}
              </p>
            )}

            {reanalyzePhase === "idle" && (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
                <UploadCloud className="size-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  クリックして画像を選択（JPEG / PNG / WebP・10MB 以下）
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {reanalyzePhase === "uploading" && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">アップロード中…</p>
              </div>
            )}

            {reanalyzePhase === "uploaded" && currentImageUrl && (
              <div className="space-y-3">
                <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden border bg-muted">
                  <Image
                    src={currentImageUrl}
                    alt="レシート"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleAnalyze}>
                    この画像で解析する
                  </Button>
                  <label className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>別の画像を選択</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            )}

            {reanalyzePhase === "analyzing" && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Gemini で品目を解析中…
                </p>
              </div>
            )}

            {reanalyzePhase === "done" && (
              <div className="space-y-3">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="size-4" />
                  解析完了。品目テーブルに反映されました。
                </p>
                <Button className="w-full" onClick={handleReanalyzeDone}>
                  閉じる
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
