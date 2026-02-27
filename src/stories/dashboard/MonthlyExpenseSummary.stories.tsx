import type { Meta, StoryObj } from "@storybook/react";
import MonthlyExpenseSummary from "@/app/(app)/_components/MonthlyExpenseSummary";

const sampleMonths = [
  { label: "10月", amount: 185000, isCurrent: false },
  { label: "11月", amount: 210000, isCurrent: false },
  { label: "12月", amount: 250000, isCurrent: false },
  { label: "1月", amount: 195000, isCurrent: false },
  { label: "2月", amount: 220000, isCurrent: true },
];

const meta = {
  title: "Dashboard/MonthlyExpenseSummary",
  component: MonthlyExpenseSummary,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "当月の支出合計と直近5ヶ月の棒グラフを表示するカード。レスポンシブ対応済み。",
      },
    },
  },
} satisfies Meta<typeof MonthlyExpenseSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    monthLabel: "2026年2月",
    recentMonths: sampleMonths,
  },
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
};

export const Mobile: Story = {
  args: {
    monthLabel: "2026年2月",
    recentMonths: sampleMonths,
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示での確認" } },
  },
  decorators: [
    (Story) => (
      <div className="h-64">
        <Story />
      </div>
    ),
  ],
};

export const NoData: Story = {
  args: {
    monthLabel: "2026年2月",
    recentMonths: [{ label: "2月", amount: 0, isCurrent: true }],
  },
  parameters: {
    docs: { description: { story: "データなしの状態" } },
  },
};

export const HighExpense: Story = {
  args: {
    monthLabel: "2026年2月",
    recentMonths: [
      { label: "10月", amount: 300000, isCurrent: false },
      { label: "11月", amount: 450000, isCurrent: false },
      { label: "12月", amount: 620000, isCurrent: false },
      { label: "1月", amount: 380000, isCurrent: false },
      { label: "2月", amount: 520000, isCurrent: true },
    ],
  },
  parameters: {
    docs: { description: { story: "高額な支出データ" } },
  },
};
