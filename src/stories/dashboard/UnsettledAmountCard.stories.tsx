import type { Meta, StoryObj } from "@storybook/react";
import UnsettledAmountCard from "@/app/(app)/_components/UnsettledAmountCard";

const meta = {
  title: "Dashboard/UnsettledAmountCard",
  component: UnsettledAmountCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "未精算（精算待ち）の共有費を表示するカード。金額が0の場合とある場合でスタイルが変わる。",
      },
    },
  },
} satisfies Meta<typeof UnsettledAmountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HasUnsettled: Story = {
  args: { unsettledAmount: 34500 },
  parameters: {
    docs: { description: { story: "未精算金額がある状態（アクセントカラーで強調）" } },
  },
};

export const Settled: Story = {
  args: { unsettledAmount: 0 },
  parameters: {
    docs: { description: { story: "未精算金額がゼロの状態（グレーで表示）" } },
  },
};

export const LargeAmount: Story = {
  args: { unsettledAmount: 128000 },
  parameters: {
    docs: { description: { story: "大きな金額の表示確認" } },
  },
};

export const Mobile: Story = {
  args: { unsettledAmount: 34500 },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示での確認" } },
  },
};
