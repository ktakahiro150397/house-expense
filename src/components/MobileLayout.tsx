"use client";

import { useRef, useState, useCallback } from "react";
import MobileHeader from "./MobileHeader";

export default function MobileLayout({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastToggleY = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const curr = e.currentTarget.scrollTop;
    if (curr <= 0) {
      setHeaderVisible(true);
      lastToggleY.current = curr;
      return;
    }
    const diffFromToggle = curr - lastToggleY.current;
    if (diffFromToggle > 8 && headerVisible) {
      setHeaderVisible(false);
      lastToggleY.current = curr;
    } else if (diffFromToggle < -8 && !headerVisible) {
      setHeaderVisible(true);
      lastToggleY.current = curr;
    }
  }, [headerVisible]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden md:[display:contents]">
      <div
        className={`shrink-0 overflow-hidden transition-[height] duration-300 md:hidden ${
          headerVisible ? "h-14" : "h-0"
        }`}
      >
        <MobileHeader isAdmin={isAdmin} />
      </div>
      <main
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-none p-4 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}
