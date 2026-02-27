import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (config) => {
    // TypeScript paths (@/*) を解決
    config.plugins = config.plugins ?? [];
    config.plugins.push(tsconfigPaths());

    // Next.js モジュールをモックに差し替え
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      "next/link": path.resolve(__dirname, "../src/__mocks__/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "../src/__mocks__/next/navigation.ts"),
      // サーバーアクション（Prisma/DB依存）をモックに差し替え
      "@/lib/actions/transactions": path.resolve(
        __dirname,
        "../src/__mocks__/actions/transactions.ts"
      ),
      "@/lib/actions/loans": path.resolve(
        __dirname,
        "../src/__mocks__/actions/loans.ts"
      ),
    };

    return config;
  },
};

export default config;
