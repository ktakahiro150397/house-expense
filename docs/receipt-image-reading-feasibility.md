# レシート画像読み取り機能の検討メモ

## 結論

- **現状コードベースでも、既存の取引に対して**
  - レシート画像をアップロードする
  - Gemini の応答を受け取る
  - 明細 (`ReceiptItem`) を登録する
  - 画面で確認・編集する
  - 商品に紐付いたものは価格推移を見る
  - という流れは **概ね実現済み**
- ただし、issue にある **Structured Output のスキーマどおり** に扱う実装ではない
- 特に `date` / `store_name` / `note` / `ocr_warning` / `price_sum` を保存・表示する仕組みは **未実装**
- そのため、**「現在の仕組みで一部は実現可能だが、issue の意図を完全に満たすには追加実装が必要」** という整理になる

## 現在の実装状況

### 1. アップロード

- `src/lib/actions/receipts.ts`
  - `uploadReceiptImage(transactionId, formData)`
  - 画像を `public/uploads/receipts` に保存
  - `Transaction.receiptImageUrl` に保存先 URL を記録
- `src/app/(app)/transactions/[id]/receipt/_components/ReceiptDetailEditor.tsx`
  - レシート詳細画面から画像アップロード可能
  - 対応形式は `JPEG / PNG / WebP`

### 2. Gemini 解析

- `src/lib/gemini.ts`
  - Gemini 連携は実装済み
  - ただし方式は **Structured Output ではなく Function Calling**
  - 現在受け取っているのは以下のみ
    - `items[{ name, price, quantity }]`
    - `totalAmount`

### 3. 登録処理

- `src/lib/actions/receipts.ts`
  - `analyzeReceipt(transactionId)`
  - 画像を解析し、`ReceiptItem` を削除→再作成
  - `ProductNameAlias` を参照して `productMasterId` を自動付与

### 4. 画面表示

- `src/app/(app)/transactions/[id]/receipt/page.tsx`
  - レシート詳細画面あり
- `ReceiptDetailEditor.tsx`
  - 解析結果を品目テーブルに反映
  - 明細の手修正・保存が可能
- `src/app/(app)/transactions/_components/TransactionTable.tsx`
  - 一覧画面からレシート詳細に遷移可能

### 5. 価格推移

- `src/lib/actions/items.ts`
  - `getProductPriceHistory(productMasterId)` あり
- `src/app/(app)/items/[id]/_components/PriceHistoryChart.tsx`
  - `ReceiptItem` を元に単価推移をグラフ表示

## issue の出力 JSON の整合性

### 良い点

- `details[].price` を整数で持つため、割引をマイナスで表現しやすい
- `note` と `ocr_warning` を分ける考え方は妥当
- `price_sum` を持たせると、明細合計との突合に使える

### 気になる点

### 1. 現行実装との項目差分が大きい

現行コードが期待しているのは:

```json
{
  "items": [
    { "name": "string", "price": 100, "quantity": 1 }
  ],
  "totalAmount": 100
}
```

issue の想定は:

```json
{
  "date": "string",
  "store_name": "string",
  "details": [
    { "name": "string", "price": 100 }
  ],
  "note": "string",
  "ocr_warning": "string",
  "price_sum": 100
}
```

- フィールド名が異なる (`items` → `details`, `totalAmount` → `price_sum`)
- **`quantity` が消えている**
  - 現在の `ReceiptItem` には `quantity` がある
  - レシートに `2点`, `3個`, `@98×2` のような表現がある場合、現行の価格推移では数量が重要
  - quantity が無いと、単価推移の精度が落ちる

### 2. `date` の形式が未定義

- 文字列ではあるが、`YYYY-MM-DD` なのか、`YYYY/MM/DD` なのか不明
- 保存や比較に使うなら形式を固定したほうがよい

### 3. `store_name` の扱い先が未定義

- 現行の `Transaction.description` を店舗名として上書きするのか
- 別カラムに保存するのか
- 現状では保存先がない

### 4. `note` / `ocr_warning` の保存先がない

- Prisma schema 上、`Transaction` / `ReceiptItem` に対応カラムがない
- UI 表示箇所もない

### 5. `price_sum` の意味を明確にしたい

- `details.price` の単純合計なのか
- 小計・税込合計・値引き反映後合計なのか
- レシート上の「合計」と一致しない場合の扱いを決める必要がある

### 6. nested object の required が弱い

`details.items.properties` には `name` / `price` があるが、ネスト側の `required` がない。

- Gemini への制約を強めたいなら、`details` の各要素にも `required: ["name", "price"]` を付けたほうが安全

## レシート読み取り後の処理は問題ないか

### 現状で問題ない点

- アップロード後に解析を実行し、`ReceiptItem` をDB保存する流れはある
- `ProductNameAlias` による自動紐付けもある
- 解析結果は画面で修正できる

### 足りない点

### 1. issue の追加項目を後続処理で使えない

現行の `analyzeReceipt()` が扱うのは `items` と `totalAmount` だけ。

そのため:

- `date`
- `store_name`
- `note`
- `ocr_warning`
- `price_sum`

を受け取っても、保存先も利用先もない。

### 2. 金額整合チェックがない

- `price_sum` と `Transaction.amount` の一致確認はしていない
- OCR 結果の合計と家計簿明細の金額がずれても警告されない

### 3. 解析は非同期受付型ではない

- `docs/overview.md` には fire-and-forget の構想がある
- しかし現実装は
  1. 画像アップロード
  2. ユーザーが「この画像で解析する」を押す
  3. その場で解析完了を待つ
- という **同期的な 2 段階操作**

## 現在のコードベースで「アップロード→結果を受け取り→データ登録→画面で見る」は可能か

### 可能

条件付きで可能。

- 対象は **既存の `Transaction` に対して**
- 導線は **`/transactions/[id]/receipt`**
- 画像アップロード後に Gemini 解析を実行
- `ReceiptItem` を保存
- 同画面および一覧画面から確認可能

### 制約

- **画像アップロードから新規 Transaction を作る流れはない**
- issue 文面だけを見ると「画像を起点に登録」も期待しうるが、現状は **取引が先、レシートは後付け**
- `store_name` や `date` を元に transaction 本体を補完する処理もない

## 意図通り、価格推移などが視覚化できるか

### できるケース

- `ReceiptItem.productMasterId` が設定されている商品は可視化できる
- `getProductPriceHistory()` で購入履歴を取得し、`PriceHistoryChart` で単価推移を表示している
- `quantity` が正しく入れば、`price / quantity` ベースで単価推移も取れる

### できない / 弱いケース

- OCR 結果が `productMasterId` に紐付かないと、商品別推移には乗らない
- 現状の自動紐付けは `ProductNameAlias.rawName` の完全一致ベース
- 新しい表記ゆれは手動で正規化が必要
- `note` / `ocr_warning` / `store_name` は可視化対象に入っていない

## 実装観点での整理

### 現状のままでできること

- 既存取引へのレシート画像アップロード
- Gemini による品目抽出
- `ReceiptItem` への登録
- レシート明細画面での編集
- 商品に紐付いたデータの価格推移表示

### 追加実装が必要なこと

- Gemini Structured Output への切り替え
- issue の JSON schema に合わせたパース
- `date` / `store_name` / `note` / `ocr_warning` / `price_sum` の保存先追加
- `price_sum` と `Transaction.amount` の突合・警告表示
- 必要であれば、レシート画像から新規 `Transaction` を作る導線

## 補足

- リポジトリの事前確認では `npm run lint` と `npm test -- --run` は成功
- `npm run build` は `@/generated/prisma/client` が見つからず失敗
- これは今回の検討ドキュメント追加とは直接無関係の既存ビルド前提不足
