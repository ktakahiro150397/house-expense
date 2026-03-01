"use client";

import { useState } from "react";
import CategoryBreakdownChart from "./CategoryBreakdownChart";
import CategoryTransactionTable from "./CategoryTransactionTable";
import type { ChartEntry, TransactionItem } from "../page";

type Props = {
  chartData: ChartEntry[];
  transactions: TransactionItem[];
};

export default function MonthlyClientShell({ chartData, transactions }: Props) {
  // undefined = 未選択, null = 未分類カテゴリ, number = カテゴリID
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null | undefined>(
    undefined
  );

  function handleSelectCategory(categoryId: number | null) {
    setSelectedCategoryId((prev) => (prev === categoryId ? undefined : categoryId));
  }

  const selectedEntry = chartData.find((d) => d.categoryId === selectedCategoryId);

  return (
    <div className="space-y-4">
      <CategoryBreakdownChart
        chartData={chartData}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />
      {selectedCategoryId !== undefined && (
        <CategoryTransactionTable
          transactions={transactions}
          selectedCategoryId={selectedCategoryId}
          categoryName={selectedEntry?.name ?? "未分類"}
          onClose={() => setSelectedCategoryId(undefined)}
        />
      )}
    </div>
  );
}
