import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import TransactionTable from "@/app/(app)/transactions/_components/TransactionTable";

// Server Actions をモック化（Storybook環境では実際のDB操作をしない）
// next/navigation は src/__mocks__/next/navigation.ts でモック済み
const categories = [
  { id: 1, name: "食費" },
  { id: 2, name: "光熱費" },
  { id: 3, name: "交通費" },
  { id: 4, name: "娯楽" },
  { id: 5, name: "医療費" },
];

const sampleTransactions = [
  {
    id: 1,
    usageDate: new Date("2026-02-15"),
    amount: -3500,
    description: "スーパーマーケット 〇〇店",
    type: "expense",
    isShared: true,
    receiptImageUrl: null,
    category: { id: 1, name: "食費" },
    dataSource: { id: 1, name: "クレジットカードA" },
    receiptItems: [],
  },
  {
    id: 2,
    usageDate: new Date("2026-02-14"),
    amount: -12800,
    description: "電気料金",
    type: "expense",
    isShared: false,
    receiptImageUrl: "https://example.com/receipt.jpg",
    category: { id: 2, name: "光熱費" },
    dataSource: { id: 2, name: "銀行口座" },
    receiptItems: [],
  },
  {
    id: 3,
    usageDate: new Date("2026-02-13"),
    amount: 250000,
    description: "給与",
    type: "income",
    isShared: false,
    receiptImageUrl: null,
    category: null,
    dataSource: { id: 2, name: "銀行口座" },
    receiptItems: [],
  },
  {
    id: 4,
    usageDate: new Date("2026-02-12"),
    amount: -800,
    description: "コンビニ ローソン〇〇店",
    type: "expense",
    isShared: false,
    receiptImageUrl: null,
    category: null,
    dataSource: { id: 1, name: "クレジットカードA" },
    receiptItems: [
      { id: 1, name: "おにぎり", price: 200, quantity: 2 },
      { id: 2, name: "お茶", price: 150, quantity: 1 },
    ],
  },
  {
    id: 5,
    usageDate: new Date("2026-02-10"),
    amount: -50000,
    description: "積立投資",
    type: "transfer",
    isShared: false,
    receiptImageUrl: null,
    category: null,
    dataSource: { id: 2, name: "銀行口座" },
    receiptItems: [],
  },
];

const meta = {
  title: "Transactions/TransactionTable",
  component: TransactionTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    pathname: "/transactions",
    docs: {
      description: {
        component: `明細一覧テーブル。\n\n- **モバイル (md未満)**: カード形式で1件ずつ縦に表示\n- **PC (md以上)**: テーブル形式で横に情報を並べて表示\n\n未分類の明細は黄色のボーダーでハイライトされる。`,
      },
    },
  },
} satisfies Meta<typeof TransactionTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  args: {
    transactions: sampleTransactions,
    categories,
  },
  parameters: {
    viewport: { defaultViewport: "desktop" },
    docs: { description: { story: "PC表示: テーブル形式" } },
  },
};

export const Mobile: Story = {
  args: {
    transactions: sampleTransactions,
    categories,
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示: カード形式" } },
  },
};

export const Tablet: Story = {
  args: {
    transactions: sampleTransactions,
    categories,
  },
  parameters: {
    viewport: { defaultViewport: "tablet" },
    docs: { description: { story: "タブレット表示 (768px): md以上のためテーブル形式" } },
  },
};

export const Empty: Story = {
  args: {
    transactions: [],
    categories,
  },
  parameters: {
    docs: { description: { story: "明細なしの状態" } },
  },
};

export const AllUncategorized: Story = {
  args: {
    transactions: sampleTransactions.map((t) => ({ ...t, category: null })),
    categories,
  },
  parameters: {
    docs: { description: { story: "全件未分類の状態（黄色ボーダーで強調）" } },
  },
};
