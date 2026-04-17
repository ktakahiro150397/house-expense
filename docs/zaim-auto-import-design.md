# Zaim 自動取込の設計検討メモ

この issue では**実装は行わず**、Zaim 連携方針が現行システムと整合するかを確認する。

## 結論

- **Zaim の家計簿明細 (`money`) を定期取得して本システムへ反映する方針自体は整合可能**。
- ただし、**現行スキーマのままでは更新検知・重複検知・口座マッピングが弱い**。
- また、issue にある「Zaim に連携済みの口座・カード情報を公式 API から取得する」という前提は、**公式 API で確実に取得できるとまでは断定できない**。
  - 公式ドキュメントで確認できるのは `money` / `account` / `category` などの API。
  - 一方で、コミュニティ実装 `pyzaim` では「Zaim の自動連携で取り込まれたカード・銀行データには API ではアクセスできないため Selenium を併用する」と明記されている。
- したがって、**実装前に「Zaim API で欲しい明細が実際に読めるか」の PoC を必須**とする。

## 確認した一次情報（公式）

- Zaim Developers Center: <https://dev.zaim.net>
- API 一覧: <https://dev.zaim.net/home/api>
- OAuth 認可: <https://dev.zaim.net/home/api/authorize>
  - OAuth 1.0a の request token / access token フローが案内されている。
- Category API: <https://dev.zaim.net/home/api/category>
  - `genre_id`, `mode(payment|income|transfer)` を持つカテゴリ情報がある。
- Account API: <https://dev.zaim.net/home/api/account>
  - `id`, `name`, `mode`, `active`, `official` を持つ口座一覧 API がある。
- Money API / 作成系: <https://dev.zaim.net/home/api/money> / <https://dev.zaim.net/home/money_create>
  - `money` レコードの取得・作成 API が存在し、`payment` / `income` / `transfer` を扱う。

## 補足確認した二次情報

- `zaim.js` README: <https://github.com/hotchemi/zaim.js>
  - `getMoney` の例として `category_id`, `genre_id`, `type`, `order`, `start_date`, `end_date`, `page`, `limit` が示されている。
- `pyzaim` README: <https://github.com/liebe-magi/pyzaim>
  - Zaim API ラッパに加え、**API でアクセスできない自動連携データ取得のため Selenium を使う**と説明されている。

## 現行システムとの整合性

### 1. 明細テーブルへの基本マッピングは可能

現行 Prisma スキーマの `Transaction` は以下を保持している。

- `usageDate`
- `amount`
- `description`
- `type` (`expense` / `income` / `transfer`)
- `dataSourceId`
- `hashKey`

このため、Zaim の `money` レコードを以下のように**概ね**格納することはできる。

- Zaim `date` → `usageDate`
- Zaim 金額 (`amount` / `price`) → `amount`
- Zaim 種別 (`payment` / `income` / `transfer`) → `type`
  - `payment` は本システムの `expense` に読み替える
- Zaim 口座 → `DataSource`
- Zaim のコメント系項目 → `description`

### 2. ただし現行スキーマのままでは不足がある

#### 2-1. `DataSource` に外部口座 ID を保持できない

`DataSource` は現在 `name`, `type`, `institution` しか持たない。

そのため、Zaim の口座 (`account.id`) とローカル `data_sources.id` を**安定して 1:1 対応付けるカラムがない**。

現状のままでは:

- 同名口座が複数あると判別できない
- 口座名変更時に再マッピングが必要
- どの Zaim 口座から来た明細かを永続的に追跡できない

#### 2-2. `Transaction` に外部明細 ID がない

`Transaction` は `hashKey` 一意制約で重複排除しているが、**Zaim 側の明細 ID を保持していない**。

そのため、将来的に以下が難しい。

- Zaim 側での明細修正の追従
- Zaim 側での明細削除の検知
- 同一明細の再取得と「更新」の区別
- Discord 通知で「何件追加 / 何件更新 / 何件削除」を正確に出すこと

#### 2-3. 現行 `hashKey` は口座差分を含まない

現在の `hashKey` 生成は `usageDate + amount + rawDescription` のみ。

つまり、次のようなケースでは**別明細でも衝突し得る**。

- 同日・同額・同摘要の支払いが別口座で発生
- 夫婦別カードで同じサブスクが同日に計上
- 同じ説明文で複数回引き落としがある

Zaim 連携では複数口座を跨ぐ前提になるため、この制約は CSV 取込時よりも表面化しやすい。

#### 2-4. `description` 1 カラムでは情報を落とす可能性がある

Zaim 系ライブラリの例では、明細には少なくとも以下のような情報が現れる。

- コメント (`comment`)
- 店舗名/場所 (`place`)
- 品名 (`name` / `item` 相当)

現行 `Transaction` は `description` 1 本なので、

- どれを優先保存するか
- 複数項目をどう連結するか
- 重複検知にどの文字列を使うか

を先に決めないと、再取込時の安定性が出ない。

## 設計上の判断

### A. 方針を成立させるための前提

この方針が成立するのは、**Zaim API で実際に取得できる対象を「Zaim 上の money 明細」と定義する場合**。

逆に、要件を

- Zaim に金融機関連携した**元のカード/銀行データそのもの**を API で読む
- Zaim が裏側で自動取込した明細を必ず API で読める

まで期待すると、現時点では不確実。

## 推奨アーキテクチャ（実装前提の設計）

### 1. サービス構成

issue の「コンテナに自動取込処理を行うサービスを 1 つ追加する」は妥当。

推奨責務:

1. OAuth 済みトークンで Zaim API を呼ぶ
2. `account` / `category` などのマスタを取得する
3. `money` を期間指定 + ページングで取得する
4. ローカル DB に upsert する
5. 実行結果を Discord Webhook へ送る

### 2. 取込単位

- 初回は広めの期間でバックフィル
- 定期実行は **直近 30〜60 日を毎回重ねて再取得**
  - API 取得漏れ・後追い修正に備えるため
- その代わり、DB 側は**必ず冪等**にする

### 3. 通知単位

Discord Webhook では最低でも以下を通知したい。

- 実行開始/終了時刻
- 対象期間
- 取得件数
- 追加件数
- 更新件数
- スキップ件数
- 失敗件数
- エラー要約

## 実装前に必要なスキーマ拡張案（今回未実装）

### `DataSource`

最低でも次が欲しい。

- `provider` (`zaim` など)
- `externalAccountId` (Zaim `account.id`)
- `importEnabled`
- `lastImportedAt`

### `Transaction`

最低でも次が欲しい。

- `externalProvider` (`zaim`)
- `externalTransactionId` (Zaim 側明細 ID)
- `sourceUpdatedAt` または `sourcePayloadHash`
- `importedAt`

この形なら:

- 追加 / 更新の判定
- 再取込時の冪等性維持
- Zaim 側更新の反映
- Discord 通知の件数精度向上

がしやすい。

## 重複明細の検出方針

### 現行のまま

- `hashKey` のみで「追加 or スキップ」を行う
- **更新検知は不可**
- 口座を跨いだ同一明細の誤衝突リスクあり

### 推奨

優先順位を次の順にする。

1. `externalProvider + externalTransactionId` で同一明細判定
2. `sourceUpdatedAt` または `sourcePayloadHash` で更新判定
3. `hashKey` は保険として残す

これで初めて「同じ明細の再取得」と「別明細の偶然一致」を分けられる。

## 実装可否の判断

### Go

以下が確認できれば進めてよい。

- 実アカウントで Zaim API から必要な `money` 明細が取得できる
- `account.id` とローカル `DataSource` の対応付けを設計できる
- `externalTransactionId` ベースの upsert に変えられる

### No-Go / 要再検討

以下なら issue の方針を見直すべき。

- Zaim API では、期待している自動連携明細が取得できない
- `money` API では必要な識別子・更新時刻が不足し、運用上の冪等性が作れない
- Zaim の連携データ取得がスクレイピング前提になる

## 今回の判断

- **設計段階では「条件付きで整合可能」**
- ただし、**その条件は「Zaim API で取得できるのが必要な明細であること」**
- 実装着手前に、必ず本番相当アカウントで API レスポンスの PoC を行うこと
