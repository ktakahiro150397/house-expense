"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = { id: number; name: string };

type Props = {
  months: string[];
  selectedMonth: string;
  categories: CategoryOption[];
  selectedCategoryId: string;
};

export default function TransactionFilters({
  months,
  selectedMonth,
  categories,
  selectedCategoryId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleMonthChange(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    params.delete("categoryId");
    router.push(`?${params.toString()}`);
  }

  function handleCategoryChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("categoryId");
    } else {
      params.set("categoryId", value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="月を選択" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedCategoryId || "all"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="カテゴリを選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのカテゴリ</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
