import { describe, it, expect } from "vitest";
import { SmbcBankParser } from "@/lib/parsers/SmbcBankParser";

const HEADER = "年月日,お引出し,お預入れ,お取り扱い内容,残高,メモ,ラベル\n";

function buildCsv(rows: string[]): string {
  return HEADER + rows.join("\n");
}

describe("SmbcBankParser", () => {
  const parser = new SmbcBankParser();

  it("V123456 ENET ATM → description='ENET ATM', type='transfer'", () => {
    const csv = buildCsv(['2024/9/20,429,,"V123456 ENET ATM",888119,"",']);
    const result = parser.parse(csv);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("ENET ATM");
    expect(result[0].type).toBe("transfer");
  });

  it("「カード」を含む摘要 → type='transfer'", () => {
    const csv = buildCsv(['2024/9/20,10000,,"カード引き落とし",500000,"",']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("transfer");
  });

  it("「ﾐﾂｲｽﾐﾄﾓｶ-ﾄﾞ」を含む摘要 → type='transfer'", () => {
    const csv = buildCsv(['2024/9/20,15000,,"ﾐﾂｲｽﾐﾄﾓｶ-ﾄﾞ引落",500000,"",']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("transfer");
  });

  it("通常の支出 → type='expense'", () => {
    const csv = buildCsv(['2024/9/14,1078,,"V786489　ダイコクドラッグ明石駅前店／ｉＤ",619765,"",']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("expense");
    expect(result[0].description).toBe("ダイコクドラッグ明石駅前店／ｉＤ");
  });

  it("入金列に値あり → type='income'", () => {
    const csv = buildCsv(['2024/9/20,,270070,"給料振込　ｶ)ﾛｼﾞﾂｸ",888548,"",']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("income");
    expect(result[0].amount).toBe(270070);
  });

  it("V056636（単体コード、スペースなし）→ クレンジングされない", () => {
    const csv = buildCsv(['2024/9/19,429,,"V056636",618478,"",']);
    const result = parser.parse(csv);
    expect(result[0].description).toBe("V056636");
    expect(result[0].type).toBe("expense");
  });

  it("同一データから生成した hashKey は毎回同一", () => {
    const csv = buildCsv(['2024/9/20,429,,"V978108",888119,"",']);
    const r1 = parser.parse(csv);
    const r2 = parser.parse(csv);
    expect(r1[0].hashKey).toBe(r2[0].hashKey);
  });

  it("異なるデータの hashKey は衝突しない", () => {
    const csv = buildCsv([
      '2024/9/20,429,,"V978108",888119,"",',
      '2024/9/14,1078,,"V786489　ダイコクドラッグ明石駅前店／ｉＤ",619765,"",',
    ]);
    const result = parser.parse(csv);
    expect(result[0].hashKey).not.toBe(result[1].hashKey);
  });

  it("ヘッダー行はトランザクションに含まれない", () => {
    const csv = buildCsv([
      '2024/9/20,429,,"V978108",888119,"",',
    ]);
    const result = parser.parse(csv);
    expect(result).toHaveLength(1);
  });

  it("実際のサンプルCSVを全行パースできる", () => {
    const csv = [
      "年月日,お引出し,お預入れ,お取り扱い内容,残高,メモ,ラベル",
      '2024/9/20,429,,"V978108",888119,"",',
      '2024/9/20,,270070,"給料振込　ｶ)ﾛｼﾞﾂｸ",888548,"",',
      '2024/9/19,429,,"V056636",618478,"",',
      '2024/9/14,1078,,"V786489　ダイコクドラッグ明石駅前店／ｉＤ",619765,"",',
    ].join("\n");
    const result = parser.parse(csv);
    expect(result).toHaveLength(4);
  });
});
