import type { Meta, StoryObj } from "@storybook/react";
import IncomeExpenseBalance from "@/app/(app)/_components/IncomeExpenseBalance";

const meta = {
  title: "Dashboard/IncomeExpenseBalance",
  component: IncomeExpenseBalance,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "今月の収入・支出・振替と収支差額を表示するカード。sm未満では文字サイズが小さくなるレスポンシブ対応あり。",
      },
    },
  },
} satisfies Meta<typeof IncomeExpenseBalance>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
  args: {
    income: 350000,
    expense: 220000,
    transfer: 50000,
  },
  parameters: {
    docs: { description: { story: "収支がプラス（黒字）" } },
  },
};

export const Negative: Story = {
  args: {
    income: 180000,
    expense: 240000,
    transfer: 0,
  },
  parameters: {
    docs: { description: { story: "収支がマイナス（赤字）" } },
  },
};

export const Mobile: Story = {
  args: {
    income: 350000,
    expense: 220000,
    transfer: 50000,
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示での確認（sm未満では文字サイズが変わる）" } },
  },
};

export const MobileLarge: Story = {
  args: {
    income: 350000,
    expense: 220000,
    transfer: 50000,
  },
  parameters: {
    viewport: { defaultViewport: "mobileLarge" },
    docs: { description: { story: "大きめモバイル (430px)" } },
  },
};
