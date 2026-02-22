import { describe, it, expect } from "vitest";
import { calculateSettlement } from "./settlement";

describe("calculateSettlement", () => {
  it("2ユーザーが異なる金額を支払った場合、差額を正しく計算する", () => {
    const transactions = [
      { userId: 1, amount: 30000 },
      { userId: 1, amount: 20000 },
      { userId: 2, amount: 10000 },
    ];
    const result = calculateSettlement(transactions);

    expect(result.userTotals.get(1)).toBe(50000);
    expect(result.userTotals.get(2)).toBe(10000);
    expect(result.morePayerUserId).toBe(1);
    expect(result.lessPayerUserId).toBe(2);
    // 差額 = (50000 - 10000) / 2 = 20000
    expect(result.difference).toBe(20000);
  });

  it("片方のユーザーのみ支払いがある場合", () => {
    const transactions = [
      { userId: 1, amount: 40000 },
    ];
    const result = calculateSettlement(transactions);

    expect(result.userTotals.get(1)).toBe(40000);
    expect(result.morePayerUserId).toBe(1);
    expect(result.lessPayerUserId).toBeNull();
    // 差額 = 40000 / 2 = 20000
    expect(result.difference).toBe(20000);
  });

  it("2ユーザーの支払いが同額の場合、差額は0になる", () => {
    const transactions = [
      { userId: 1, amount: 15000 },
      { userId: 2, amount: 15000 },
    ];
    const result = calculateSettlement(transactions);

    expect(result.userTotals.get(1)).toBe(15000);
    expect(result.userTotals.get(2)).toBe(15000);
    expect(result.difference).toBe(0);
  });

  it("空配列の場合、差額は0でユーザーIDはnullになる", () => {
    const result = calculateSettlement([]);

    expect(result.userTotals.size).toBe(0);
    expect(result.morePayerUserId).toBeNull();
    expect(result.lessPayerUserId).toBeNull();
    expect(result.difference).toBe(0);
  });
});
