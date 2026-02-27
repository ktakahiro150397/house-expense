import type { Meta, StoryObj } from "@storybook/react";
import TopSpendingItems from "@/app/(app)/_components/TopSpendingItems";

const sampleItems = [
  { description: "スーパーマーケット 〇〇店", amount: 45000, count: 12 },
  { description: "電気料金", amount: 12800, count: 1 },
  { description: "ガス料金", amount: 8500, count: 1 },
  { description: "コンビニ", amount: 7200, count: 8 },
  { description: "外食・レストラン", amount: 6500, count: 3 },
];

const meta = {
  title: "Dashboard/TopSpendingItems",
  component: TopSpendingItems,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "当月の支出上位品目をランキング形式で表示するカード。説明テキストが長い場合は truncate で省略される。",
      },
    },
  },
} satisfies Meta<typeof TopSpendingItems>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: sampleItems,
    monthLabel: "2026年2月",
  },
};

export const Empty: Story = {
  args: {
    items: [],
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "データなしの状態" } },
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ description: "スーパーマーケット", amount: 45000, count: 1 }],
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "件数が1件の場合は「N件の合計」を表示しない" } },
  },
};

export const LongDescription: Story = {
  args: {
    items: [
      { description: "とても長い品目名前のサンプルテキスト株式会社〇〇〇〇〇〇〇〇〇〇店", amount: 45000, count: 5 },
      { description: "スーパーマーケット ABCDEFGHIJKLMNOPQRSTUVWXYZとても長い名前", amount: 12000, count: 3 },
    ],
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "長い説明文が truncate されることを確認" } },
  },
};

export const Mobile: Story = {
  args: {
    items: sampleItems,
    monthLabel: "2026年2月",
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示での確認" } },
  },
};
