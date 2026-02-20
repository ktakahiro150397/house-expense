import { describe, it, expect } from "vitest";
import { SmbcCardParser } from "@/lib/parsers/SmbcCardParser";

const SINGLE_SECTION_CSV = [
  "小池　崇広　様,4980-00**-****-****,Ｏｌｉｖｅゴールド／クレジット",
  "2024/05/01,ユーネクストサービス利用料,2189,１,１,2189,",
  "2024/06/01,プルデンシャル生命保険,3230,１,１,3230,",
  "2024/06/08,バーガーキング,1150,１,１,1150,",
  ",,,,,257117,",
].join("\n");

const MULTI_SECTION_CSV = [
  "小池　崇広　様,4980-00**-****-****,Ｏｌｉｖｅゴールド／クレジット",
  "2024/05/01,ユーネクストサービス利用料,2189,１,１,2189,",
  "2024/06/01,プルデンシャル生命保険,3230,１,１,3230,",
  ",,,,,5419,",
  "山田　花子　様,1234-56**-****-****,Ｏｌｉｖｅ／クレジット",
  "2024/06/08,バーガーキング,1150,１,１,1150,",
  "2024/06/10,金引青果,200,１,１,200,",
  ",,,,,1350,",
].join("\n");

describe("SmbcCardParser", () => {
  const parser = new SmbcCardParser();

  it("セクションヘッダー行はトランザクションに含まれない", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    const hasHeader = result.some(
      (t) => t.description === "小池　崇広　様" || t.description.includes("様")
    );
    expect(hasHeader).toBe(false);
  });

  it("小計行はトランザクションに含まれない", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    expect(result).toHaveLength(3);
  });

  it("全取引が type='expense'", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    for (const t of result) {
      expect(t.type).toBe("expense");
    }
  });

  it("amount は col2 の数値", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    expect(result[0].amount).toBe(2189);
    expect(result[1].amount).toBe(3230);
    expect(result[2].amount).toBe(1150);
  });

  it("各トランザクションに正しい cardHolder が付与される（単一セクション）", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    for (const t of result) {
      expect(t.cardHolder).toBe("小池　崇広");
    }
  });

  it("複数セクション: 各トランザクションに正しい cardHolder が付与される", () => {
    const result = parser.parse(MULTI_SECTION_CSV);
    expect(result).toHaveLength(4);
    expect(result[0].cardHolder).toBe("小池　崇広");
    expect(result[1].cardHolder).toBe("小池　崇広");
    expect(result[2].cardHolder).toBe("山田　花子");
    expect(result[3].cardHolder).toBe("山田　花子");
  });

  it("hashKey は同一データで常に同じ値を返す", () => {
    const r1 = parser.parse(SINGLE_SECTION_CSV);
    const r2 = parser.parse(SINGLE_SECTION_CSV);
    expect(r1[0].hashKey).toBe(r2[0].hashKey);
  });

  it("異なるトランザクションの hashKey は衝突しない", () => {
    const result = parser.parse(SINGLE_SECTION_CSV);
    const keys = result.map((t) => t.hashKey);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
