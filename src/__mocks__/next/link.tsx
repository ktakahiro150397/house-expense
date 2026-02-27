import React from "react";

type LinkProps = {
  href: string | { pathname?: string; query?: Record<string, string> };
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  [key: string]: unknown;
};

export default function Link({ href, children, prefetch: _prefetch, replace: _replace, scroll: _scroll, ...props }: LinkProps) {
  const hrefStr = typeof href === "string" ? href : href.pathname ?? "/";
  return (
    <a href={hrefStr} {...props}>
      {children}
    </a>
  );
}
