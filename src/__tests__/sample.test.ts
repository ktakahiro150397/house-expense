import { describe, it, expect } from "vitest";

describe("Vitest セットアップ確認", () => {
  it("基本的なアサーションが動作すること", () => {
    expect(1 + 1).toBe(2);
  });

  it("文字列のマッチングが動作すること", () => {
    expect("家計簿アプリ").toContain("家計簿");
  });
});
