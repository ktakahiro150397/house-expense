前提: プロジェクト共通のコンテキスト
※ 最初のプロンプトの冒頭、または .cursorrules などに設定しておくと精度が上がります。
# プロジェクト概要
Next.js (App Router), TypeScript, Prisma (MySQL), NextAuth.js, Tailwind CSS を使用した「プライベート家計簿アプリ」を開発します。

# 技術スタック
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- ORM: Prisma
- DB: MySQL (Docker)
- Auth: NextAuth.js (Google OAuth + WhiteList)
- Test: Vitest (単体テスト必須)
- UI: Shadcn/ui (推奨), Recharts

# 開発方針
- 「画面」ではなく「機能」単位で実装する。
- 複雑なロジック（CSVパース、集計など）は必ず Vitest で単体テストを書く。
- DBのカラム名はスネークケース (`user_id`)、コード内はキャメルケース (`userId`) を徹底する。

--------------------------------------------------------------------------------
### 共通UI基盤（フェーズ1と並行）
- Shadcn/ui コンポーネントのインストール（button, card, badge, table, select, input）
- サイドバーナビゲーション付き共通レイアウト（(app) ルートグループ）
- 認証ページ専用レイアウト（中央寄せカード）

--------------------------------------------------------------------------------
フェーズ1：DB構築・認証・テスト基盤
目的: データの箱を作り、特定ユーザーのみログインできるようにする。
プロンプト:
家計簿アプリの土台を作成します。以下の手順で実装してください。

### 1. Prisma Schema の作成
以下の要件に基づき `prisma/schema.prisma` を定義してください。
- **User:** `id`, `email` (unique), `name`.
- **Category:** `id`, `name`.
- **CategoryRule:** `id`, `categoryId`, `keyword` (unique).
- **Transaction:**
  - `id`, `userId`, `usageDate` (発生日), `amount` (絶対値で保存), `description`.
  - `type`: String ("expense", "income", "transfer") ※二重計上防止のため必須
  - `categoryId`: Int? (AI解析前はNull許容)
  - `isShared`: Boolean (デフォルト false)
  - `settlementDate`: DateTime? (Nullなら未精算、日付が入っていれば精算済)
  - `hashKey`: String (unique) - 重複防止用
- **Loan / LoanSchedule:** 負債管理用テーブル。
- **ReceiptItem:** Transactionの子テーブル（レシート明細）。

### 2. 初期データ投入 (Seeding)
`prisma/seed.ts` を作成してください。
- 環境変数 `INIT_USER_EMAILS` (カンマ区切り文字列) を読み込む。
- DBにユーザーが存在しない場合のみ、許可されたメールアドレスを `User` テーブルに登録する処理を書いてください。

### 3. 認証機能 (NextAuth.js)
- Google Provider を設定。
- `signIn` コールバックにて、ログインしようとしたメールアドレスが `User` テーブルに存在するかチェックし、存在しない場合は拒否する「ホワイトリスト方式」を実装してください。

### 4. テスト環境構築
- **Vitest** をセットアップし、`npm run test` で実行できるようにしてください。

### UI整備: ログイン・エラー画面（完了済み）
- `/auth/signin`, `/auth/error` ページ実装済み（Shadcn/uiスタイル適用）

--------------------------------------------------------------------------------
フェーズ2-A：CSV取込機能（ロジック移植 & テスト）
目的: 既存のGASロジックを移植し、正確にCSVを取り込む。
プロンプト:
CSVアップロードとパース機能を実装します。既存システム（GAS/TypeScript）のロジックを移植してください。

### 1. 設計方針 (Strategy Pattern)
- インターフェース `TransactionParser` を定義 (`parse(content: string): Transaction[]`)。
- 実装クラス `SmbcBankParser`, `SmbcCardParser` などを作成し、拡張性を持たせること。

### 2. 既存ロジックの移植（最重要）
以下のレガシーコード（GAS）のロジックを、Next.js上のTypeScriptロジックとして書き換えてください。
特に「摘要のクレンジング」と「振替（Transfer）判定」はそのまま再現してください。

**参照コード1: 文字列整形 (getClensingDescription.ts)**
```typescript
export function getClensingDescription(description: string): string {
  let ret = description.trim();
  const regex = /^V\d{6}[　| ](.*)/; // V123456 などを削除
  const match = ret.match(regex);
  if (match) ret = match[1];
  return ret;
}

参照コード2: 振替判定ロジック (processSMBCBankData.tsより抜粋)
// 銀行CSVのロジック移植要件:
// 1. description に "ENET" や "カード" が含まれる場合 -&gt; type = "transfer"
// 2. description に "ﾐﾂｲｽﾐﾄﾓｶ-ﾄﾞ" が含まれる場合 -&gt; type = "transfer"
// 3. 支出列が空で収入列がある場合 -&gt; type = "income"
// 4. それ以外 -&gt; type = "expense"

3. 重複防止ロジック
• utils/hash.ts を作成。
• usageDate, amount, description を結合してハッシュ化し、Transaction.hashKey を生成する関数を実装してください。
4. テストの実装 (必須)
• parsers/SmbcBankParser.test.ts を作成し、Vitestで以下のケースを検証してください。
    ◦ "V123456 ENET ATM" という摘要が "ENET ATM" に整形され、typeが "transfer" になること。
    ◦ 通常の支出が "expense" になること。

### UI整備: CSVインポート画面（完了済み）
- サイドバー付き共通レイアウト（(app) ルートグループ）
- Shadcn/ui コンポーネント（Button, Card, Badge, Table, Select, Input）を適用

---

### フェーズ2-B：レシート画像解析（非同期UX）
**目的:** 待たされない画像アップロード体験を作る。

**プロンプト:**
```markdown
レシート画像のアップロードとAI解析機能を実装します。

### 1. Server Action: `uploadReceipt`
**「Fire-and-forget」パターン** で実装してください。
1. クライアントから `FormData` を受け取る。
2. サーバーは即座に `{ success: true }` を return する（await で解析完了を待たない）。
3. レスポンス返却後、バックグラウンドで `processReceiptInBackground` 関数を実行する。

### 2. バックグラウンド処理 (`processReceiptInBackground`)
1. Gemini API (Flashモデル推奨) に画像を送信し、JSON形式で「合計金額」「品目リスト」を受け取る。
2. 受け取ったデータを `Transaction` および `ReceiptItem` テーブルに保存する。
3. エラーが発生してもサーバープロセスが落ちないよう、適切な `try-catch` ブロックで囲むこと。

### 3. 画面 UI
- `/transactions/new` にファイルアップロードUIを作成。
- アップロードボタンを押したら、即座に「受付完了」を表示し、一覧画面へ遷移させる。

### UI整備: レシートアップロード画面
- `/transactions/new` のUI実装（Shadcn/ui）

--------------------------------------------------------------------------------
フェーズ3：精算（割り勘）機能
目的: パートナーとの貸し借りを管理する。
プロンプト:
家計の精算（割り勘）管理機能を実装します。

### 1. ロジック要件
- **未精算データの定義:** `Transaction` テーブルの `isShared` が `true`、かつ `settlementDate` が `null` のレコード。
- **精算アクション:** ユーザーが「精算完了」ボタンを押すと、対象レコードの `settlementDate` を `Now()` で一括更新する。

### 2. 画面 UI (`/settlement`)
- 現在の「未精算リスト」を表示。
- 「Aさんが払った総額」「Bさんが払った総額」を集計し、「どちらがいくら支払うべきか（差額）」を表示するカードを作成。
- 画面下部に「精算を確定する」ボタンを配置。

### 3. テスト
- 未精算データのみが集計対象になるか、精算済み（日付入り）は除外されるかを検証するVitestコードを書いてください。

### UI整備: 精算画面
- `/settlement` のUI実装（未精算リスト、差額カード、精算確定ボタン）

--------------------------------------------------------------------------------
フェーズ4：可視化と拡張
目的: 家計簿として使えるようにする。
プロンプト:
最後に、登録されたデータを閲覧するダッシュボードとローン管理機能を実装します。

### 1. ダッシュボード (`/`)
- 今月の `type="expense"` の合計金額を表示（`transfer` は除外すること）。
- カテゴリ別の支出割合を円グラフで表示（Rechartsを使用）。

### 2. 明細一覧 (`/transactions`)
- 月別、カテゴリ別でフィルタリングできる一覧テーブル。
- 各行で `category` の変更や、`isShared` フラグの切り替えができるようにする。
- **学習機能:** カテゴリを手動変更した際、「このキーワードを辞書(`CategoryRule`)に登録しますか？」と尋ね、YesならDBに保存する処理を追加。

### 3. ローン管理 (`/loans`)
- `LoanSchedule` テーブルから返済予定を読み込み、表示する。
- 毎月の返済が終わったらチェックを入れると `status` が `paid` になるUI。
- 「残債務（未払い分の合計）」を計算して表示する。

### UI整備: ダッシュボード・明細・ローン管理画面
- ダッシュボード（`/`）: 今月支出カード、カテゴリ別円グラフ（Recharts）
- 明細一覧（`/transactions`）: フィルタ付きテーブル
- ローン管理（`/loans`）: 返済予定テーブル、残債務表示