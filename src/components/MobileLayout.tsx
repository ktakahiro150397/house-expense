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
  const lastScrollY = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const curr = e.currentTarget.scrollTop;
    if (curr <= 0) {
      setHeaderVisible(true);
      lastScrollY.current = curr;
      return;
    }
    const diff = curr - lastScrollY.current;
    if (diff > 8) setHeaderVisible(false);
    else if (diff < -8) setHeaderVisible(true);
    lastScrollY.current = curr;
  }, []);

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
