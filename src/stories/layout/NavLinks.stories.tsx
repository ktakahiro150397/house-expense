import type { Meta, StoryObj } from "@storybook/react";
import NavLinks from "@/components/NavLinks";

const meta = {
  title: "Layout/NavLinks",
  component: NavLinks,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    pathname: "/",
    docs: {
      description: {
        component:
          "サイドバー・ドロワー内のナビゲーションリンク一覧。現在のパスに応じてアクティブスタイルが切り替わる。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-56 border rounded-lg bg-card h-[600px] flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  args: { isAdmin: false },
  parameters: {
    pathname: "/",
    docs: { description: { story: "ホームがアクティブ" } },
  },
};

export const Transactions: Story = {
  args: { isAdmin: false },
  parameters: {
    pathname: "/transactions",
    docs: { description: { story: "明細一覧がアクティブ" } },
  },
};

export const AdminUser: Story = {
  args: { isAdmin: true },
  parameters: {
    pathname: "/",
    docs: { description: { story: "管理者メニュー（テーマ管理）が表示される" } },
  },
};
