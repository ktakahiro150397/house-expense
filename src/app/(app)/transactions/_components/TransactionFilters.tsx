"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

type CategoryOption = { id: number; name: string };
type DataSourceOption = { id: number; name: string };

type Props = {
  months: string[];
  monthFrom: string;
  monthTo: string;
  categories: CategoryOption[];
  selectedCategoryIds: number[];
  selectedType: string;
  dataSources: DataSourceOption[];
  selectedDataSourceId: string;
  isSharedFilter: boolean;
};

export default function TransactionFilters({
  months,
  monthFrom,
  monthTo,
  categories,
  selectedCategoryIds,
  selectedType,
  dataSources,
  selectedDataSourceId,
  isSharedFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // monthFrom 以降の月のみ monthTo の選択肢に表示する
  const availableToMonths = months.filter((m) => m >= monthFrom);

  const activeFilterCount =
    (selectedCategoryIds.length > 0 ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedDataSourceId ? 1 : 0) +
    (isSharedFilter ? 1 : 0);

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (!val) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.push(`?${params.toString()}`);
  }

  function handleMonthFromChange(val: string) {
    // monthTo を常にURLに含めることで、サーバー側でのリセットを防ぐ
    const updates: Record<string, string | null> = {
      monthFrom: val,
      monthTo: monthTo < val ? val : monthTo,
    };
    pushParams(updates);
  }

  function handleMonthToChange(val: string) {
    pushParams({ monthTo: val });
  }

  function handleCategoryToggle(id: number, checked: boolean) {
    const current = new Set(selectedCategoryIds);
    if (checked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    const joined = current.size > 0 ? [...current].join(",") : null;
    pushParams({ categoryIds: joined });
  }

  function handleClearCategories() {
    pushParams({ categoryIds: null });
  }

  function handleTypeChange(val: string) {
    pushParams({ type: val === "all" ? null : val });
  }

  function handleDataSourceChange(val: string) {
    pushParams({ dataSourceId: val === "all" ? null : val });
  }

  function handleIsSharedChange(checked: boolean) {
    pushParams({ isShared: checked ? "1" : null });
  }

  const filterBody = (
    <div className="flex flex-wrap gap-3 items-center">
      {/* 月範囲 */}
      <div className="flex items-center gap-2">
        <Select value={monthFrom} onValueChange={handleMonthFromChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="開始月" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">〜</span>
        <Select value={monthTo} onValueChange={handleMonthToChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="終了月" />
          </SelectTrigger>
          <SelectContent>
            {availableToMonths.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 種別 */}
      <Select value={selectedType || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="種別" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての種別</SelectItem>
          <SelectItem value="expense">支出</SelectItem>
          <SelectItem value="income">収入</SelectItem>
          <SelectItem value="transfer">振替</SelectItem>
        </SelectContent>
      </Select>

      {/* データソース */}
      <Select
        value={selectedDataSourceId || "all"}
        onValueChange={handleDataSourceChange}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="データソース" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのデータソース</SelectItem>
          {dataSources.map((ds) => (
            <SelectItem key={ds.id} value={String(ds.id)}>
              {ds.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* カテゴリ複数選択 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-52 justify-between font-normal">
            {selectedCategoryIds.length === 0
              ? "すべてのカテゴリ"
              : `${selectedCategoryIds.length} カテゴリ選択中`}
            <ChevronDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start">
          <button
            onClick={handleClearCategories}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            すべてクリア
          </button>
          <div className="max-h-60 overflow-y-auto space-y-1 mt-1">
            <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer">
              <Checkbox
                checked={selectedCategoryIds.includes(0)}
                onCheckedChange={(checked) =>
                  handleCategoryToggle(0, Boolean(checked))
                }
              />
              <span className="text-sm text-muted-foreground">未分類</span>
            </label>
            {categories.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selectedCategoryIds.includes(c.id)}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle(c.id, Boolean(checked))
                  }
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 共有のみ */}
      <div className="flex items-center gap-2">
        <Switch
          id="isShared-filter"
          checked={isSharedFilter}
          onCheckedChange={handleIsSharedChange}
        />
        <label htmlFor="isShared-filter" className="text-sm cursor-pointer">
          共有のみ
        </label>
      </div>
    </div>
  );

  return (
    <div>
      {/* モバイル: 折り畳みボタン */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            絞り込み
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          />
        </Button>
        {mobileOpen && (
          <div className="mt-3 p-3 border rounded-lg bg-card flex flex-col gap-3">
            {/* 月範囲 */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">期間</p>
              <div className="flex items-center gap-2">
                <Select value={monthFrom} onValueChange={handleMonthFromChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="開始月" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-sm shrink-0">〜</span>
                <Select value={monthTo} onValueChange={handleMonthToChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="終了月" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToMonths.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 種別 */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">種別</p>
              <Select value={selectedType || "all"} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="種別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての種別</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                  <SelectItem value="income">収入</SelectItem>
                  <SelectItem value="transfer">振替</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* データソース */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">データソース</p>
              <Select value={selectedDataSourceId || "all"} onValueChange={handleDataSourceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="データソース" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのデータソース</SelectItem>
                  {dataSources.map((ds) => (
                    <SelectItem key={ds.id} value={String(ds.id)}>{ds.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* カテゴリ */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">カテゴリ</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    {selectedCategoryIds.length === 0
                      ? "すべてのカテゴリ"
                      : `${selectedCategoryIds.length} カテゴリ選択中`}
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <button
                    onClick={handleClearCategories}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    すべてクリア
                  </button>
                  <div className="max-h-52 overflow-y-auto space-y-1 mt-1">
                    <label className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent cursor-pointer">
                      <Checkbox
                        checked={selectedCategoryIds.includes(0)}
                        onCheckedChange={(checked) => handleCategoryToggle(0, Boolean(checked))}
                      />
                      <span className="text-sm text-muted-foreground">未分類</span>
                    </label>
                    {categories.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCategoryIds.includes(c.id)}
                          onCheckedChange={(checked) => handleCategoryToggle(c.id, Boolean(checked))}
                        />
                        <span className="text-sm">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* 共有のみ */}
            <div className="flex items-center gap-2">
              <Switch
                id="isShared-filter-mobile"
                checked={isSharedFilter}
                onCheckedChange={handleIsSharedChange}
              />
              <label htmlFor="isShared-filter-mobile" className="text-sm cursor-pointer">
                共有のみ
              </label>
            </div>
          </div>
        )}
      </div>

      {/* PC: 横並び表示 */}
      <div className="hidden md:block">{filterBody}</div>
    </div>
  );
}
