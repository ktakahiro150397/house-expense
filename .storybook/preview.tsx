import type { Preview } from "@storybook/react";
import React from "react";
import "../src/app/globals.css";
import { AccentColorProvider } from "../src/components/AccentColorProvider";

/** モバイル・タブレット・PCのビューポートプリセット */
const customViewports = {
  mobile: {
    name: "Mobile (375px)",
    styles: { width: "375px", height: "812px" },
    type: "mobile" as const,
  },
  mobileLarge: {
    name: "Mobile L (430px)",
    styles: { width: "430px", height: "932px" },
    type: "mobile" as const,
  },
  tablet: {
    name: "Tablet (768px)",
    styles: { width: "768px", height: "1024px" },
    type: "tablet" as const,
  },
  desktop: {
    name: "Desktop (1280px)",
    styles: { width: "1280px", height: "800px" },
    type: "desktop" as const,
  },
  desktopLarge: {
    name: "Desktop L (1440px)",
    styles: { width: "1440px", height: "900px" },
    type: "desktop" as const,
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: customViewports,
      defaultViewport: "desktop",
    },
  },
  decorators: [
    (Story, context) => {
      // parameters.pathname が指定されていれば usePathname モックに渡す
      const pathname = context.parameters?.pathname as string | undefined;
      if (typeof window !== "undefined") {
        if (pathname) {
          (window as unknown as Record<string, string>).__storybook_pathname__ = pathname;
        } else {
          delete (window as unknown as Record<string, unknown>).__storybook_pathname__;
        }
      }
      return (
        <AccentColorProvider>
          <Story />
        </AccentColorProvider>
      );
    },
  ],
};

export default preview;
