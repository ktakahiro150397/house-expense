"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DataSourceOption = { id: number; name: string };

type Props = {
  allDataSources: DataSourceOption[];
  selectedIds: number[];
  year: number;
  month: number;
};

export default function DataSourceFilter({
  allDataSources,
  selectedIds,
  year,
  month,
}: Props) {
  const router = useRouter();
  const selectedSet = new Set(selectedIds);

  function push(ids: Set<number>) {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (ids.size > 0) params.set("dataSources", [...ids].join(","));
    router.push(`/monthly?${params.toString()}`);
  }

  function handleToggle(id: number, checked: boolean) {
    const current = new Set(selectedIds);
    if (checked) current.add(id);
    else current.delete(id);
    push(current);
  }

  function handleClear() {
    push(new Set());
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between font-normal">
          {selectedIds.length === 0
            ? "データソース: 全て"
            : `${selectedIds.length} データソース選択中`}
          <ChevronDown className="size-4 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
        >
          すべてクリア
        </button>
        <div className="max-h-60 overflow-y-auto space-y-1 mt-1">
          {allDataSources.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-1">データソースなし</p>
          )}
          {allDataSources.map((ds) => (
            <label
              key={ds.id}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selectedSet.has(ds.id)}
                onCheckedChange={(checked) => handleToggle(ds.id, Boolean(checked))}
              />
              <span className="text-sm">{ds.name}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
