import { describe, it, expect } from "vitest";
import { SbiBankParser } from "@/lib/parsers/SbiBankParser";

const HEADER = '"日付","内容","出金金額(円)","入金金額(円)","残高(円)","メモ"\n';

function buildCsv(rows: string[]): string {
  return HEADER + rows.join("\n");
}

describe("SbiBankParser", () => {
  const parser = new SbiBankParser();

  it("ヘッダー行はトランザクションに含まれない", () => {
    const csv = buildCsv(['"2024/09/27","振込","3,670","","92,296","-"']);
    const result = parser.parse(csv);
    expect(result).toHaveLength(1);
  });

  it("出金あり → type='expense'", () => {
    const csv = buildCsv(['"2024/09/27","振込＊カ）ワースワイルエムエフデイーオオ","3,670","","92,296","-"']);
    const result = parser.parse(csv);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("expense");
    expect(result[0].amount).toBe(3670);
  });

  it("出金あり + 振替KW（ＳＢＩハイブリッド預金）→ type='transfer'", () => {
    const csv = buildCsv(['"2024/09/25","ＳＢＩハイブリッド預金","15,000","","117,966","-"']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("transfer");
    expect(result[0].amount).toBe(15000);
  });

  it("入金あり → type='income'", () => {
    const csv = buildCsv(['"2024/09/22","利息","","2","132,966","-"']);
    const result = parser.parse(csv);
    expect(result[0].type).toBe("income");
    expect(result[0].amount).toBe(2);
  });

  it("入金あり + 振替KW → type='transfer'", () => {
    const csv = buildCsv(['"2024/09/22","ＳＢＩハイブリッド預金","","10,000","132,966","-"']);
    const parser2 = new SbiBankParser();
    const result = parser2.parse(csv);
    expect(result[0].type).toBe("transfer");
  });

  it("金額のカンマ除去（\"3,670\" → 3670）", () => {
    const csv = buildCsv(['"2024/09/27","テスト","3,670","","92,296","-"']);
    const result = parser.parse(csv);
    expect(result[0].amount).toBe(3670);
  });

  it("hashKey 決定性（同一入力 → 同一hash）", () => {
    const csv = buildCsv(['"2024/09/27","振込＊テスト","3,670","","92,296","-"']);
    const r1 = parser.parse(csv);
    const r2 = parser.parse(csv);
    expect(r1[0].hashKey).toBe(r2[0].hashKey);
  });

  it("hashKey 一意性（異なる入力 → 異なるhash）", () => {
    const csv = buildCsv([
      '"2024/09/27","振込＊カ）ワースワイルエムエフデイーオオ","3,670","","92,296","-"',
      '"2024/09/25","ＳＢＩハイブリッド預金","15,000","","117,966","-"',
    ]);
    const result = parser.parse(csv);
    expect(result[0].hashKey).not.toBe(result[1].hashKey);
  });

  it("サンプルCSV全行パース（ヘッダー除く7件）", () => {
    const csv = [
      '"日付","内容","出金金額(円)","入金金額(円)","残高(円)","メモ"',
      '"2024/09/27","振込＊カ）ワースワイルエムエフデイーオオ","3,670","","92,296","-"',
      '"2024/09/25","ＳＢＩハイブリッド預金","15,000","","117,966","-"',
      '"2024/09/22","利息","","2","132,966","-"',
      '"2024/09/20","コンビニATM出金","10,000","","132,964","-"',
      '"2024/09/15","給与振込","","200,000","142,964","-"',
      '"2024/09/10","電気代","5,000","","142,964","-"',
      '"2024/09/05","水道代","2,500","","147,964","-"',
    ].join("\n");
    const result = parser.parse(csv);
    expect(result).toHaveLength(7);
  });
});
