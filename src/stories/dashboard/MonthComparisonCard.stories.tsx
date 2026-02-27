import type { Meta, StoryObj } from "@storybook/react";
import MonthComparisonCard from "@/app/(app)/_components/MonthComparisonCard";

const meta = {
  title: "Dashboard/MonthComparisonCard",
  component: MonthComparisonCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "当月と前月の支出を比較するカード。増減を赤/緑の矢印で表示する。",
      },
    },
  },
} satisfies Meta<typeof MonthComparisonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Increased: Story = {
  args: {
    currentAmount: 220000,
    previousAmount: 195000,
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "前月より支出が増加（赤色で▲表示）" } },
  },
};

export const Decreased: Story = {
  args: {
    currentAmount: 170000,
    previousAmount: 195000,
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "前月より支出が減少（緑色で▼表示）" } },
  },
};

export const Same: Story = {
  args: {
    currentAmount: 195000,
    previousAmount: 195000,
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "前月と同額（増減表示なし）" } },
  },
};

export const NoPreviousData: Story = {
  args: {
    currentAmount: 195000,
    previousAmount: 0,
    monthLabel: "2026年2月",
  },
  parameters: {
    docs: { description: { story: "前月データなし" } },
  },
};

export const Mobile: Story = {
  args: {
    currentAmount: 220000,
    previousAmount: 195000,
    monthLabel: "2026年2月",
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "モバイル表示での確認" } },
  },
};
