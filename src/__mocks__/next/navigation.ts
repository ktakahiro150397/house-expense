// Storybook mock for next/navigation
// usePathname reads from window.__storybook_pathname__ if set by story parameters

export function usePathname(): string {
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).__storybook_pathname__) {
    return (window as unknown as Record<string, string>).__storybook_pathname__;
  }
  return "/";
}

export function useRouter() {
  return {
    push: (url: string) => { console.log("[mock] router.push:", url); },
    replace: (url: string) => { console.log("[mock] router.replace:", url); },
    back: () => { console.log("[mock] router.back"); },
    forward: () => { console.log("[mock] router.forward"); },
    refresh: () => { console.log("[mock] router.refresh"); },
    prefetch: () => {},
  };
}

export function useParams(): Record<string, string | string[]> {
  return {};
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function redirect(url: string): never {
  console.log("[mock] redirect:", url);
  throw new Error(`Redirect to ${url}`);
}

export function notFound(): never {
  console.log("[mock] notFound");
  throw new Error("Not found");
}
