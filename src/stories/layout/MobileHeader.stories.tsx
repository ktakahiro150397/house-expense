import type { Meta, StoryObj } from "@storybook/react";
import MobileHeader from "@/components/MobileHeader";

const meta = {
  title: "Layout/MobileHeader",
  component: MobileHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "モバイル用ヘッダー。md未満の画面幅でのみ表示される（md以上では非表示）。ハンバーガーメニューからナビゲーションを開くドロワーを含む。",
      },
    },
  },
} satisfies Meta<typeof MobileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isAdmin: false,
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "通常ユーザー向けのモバイルヘッダー" } },
  },
};

export const AdminUser: Story = {
  args: {
    isAdmin: true,
  },
  parameters: {
    viewport: { defaultViewport: "mobile" },
    docs: { description: { story: "管理者ユーザー向けのモバイルヘッダー（管理メニューあり）" } },
  },
};

export const MobileLarge: Story = {
  args: {
    isAdmin: false,
  },
  parameters: {
    viewport: { defaultViewport: "mobileLarge" },
    docs: { description: { story: "大きめのモバイル画面 (430px)" } },
  },
};
