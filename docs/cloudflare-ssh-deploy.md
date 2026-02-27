# Cloudflare Tunnel 経由 SSH 自動デプロイ セットアップガイド

main ブランチへの push をトリガーに、GitHub Actions が Cloudflare Tunnel 経由で自宅サーバーに SSH し、Docker コンテナを自動更新します。

## フロー

```
git push main
  → GitHub Actions: Docker ビルド & ghcr.io へ push
  → GitHub Actions: cloudflared で SSH トンネル接続
  → 自宅サーバー: docker compose pull app && up -d app
```

## 必要なもの

- Cloudflare アカウント（無料プランで可）
- 自宅サーバーで動作中の `cloudflared`
- GitHub リポジトリの Secrets 設定権限

---

## 1. 自宅サーバー側の設定

### 1-1. SSH キーペアを生成

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -C "github-actions-deploy" -N ""
```

- `~/.ssh/github_actions_deploy` → 秘密鍵（GitHub Secrets に登録）
- `~/.ssh/github_actions_deploy.pub` → 公開鍵（サーバーに登録）

### 1-2. 公開鍵をサーバーに登録

```bash
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 1-3. Cloudflare Tunnel に SSH インバウンドを追加

Cloudflare Zero Trust ダッシュボード → **Networks > Tunnels** → 既存のトンネルを編集 → **Public Hostname** を追加：

| フィールド | 値 |
|---|---|
| Subdomain | `ssh` （例: `ssh.example.com`） |
| Domain | 自分のドメイン |
| Type | `SSH` |
| URL | `localhost:22` |

### 1-4. Cloudflare Access アプリケーションを作成（サービストークン用）

Cloudflare Zero Trust → **Access > Applications** → **Add an Application** → **Self-hosted**:

| フィールド | 値 |
|---|---|
| Application name | `house-expense-deploy` |
| Application domain | `ssh.your-domain.com` |
| Session duration | `24 hours` |

**Policy を追加**:
- Policy name: `GitHub Actions`
- Action: `Service Auth`

**Service Token を作成**:
**Access > Service Auth > Service Tokens** → **Create Service Token**

→ 表示される `Client ID` と `Client Secret` をメモする（一度しか表示されない）

---

## 2. GitHub Secrets の登録

リポジトリの **Settings > Secrets and variables > Actions** で以下を登録：

| Secret 名 | 値 |
|---|---|
| `DEPLOY_SSH_PRIVATE_KEY` | `~/.ssh/github_actions_deploy` の内容（`-----BEGIN...` から末尾まで） |
| `DEPLOY_SSH_USER` | SSH のユーザー名（例: `pi`, `ubuntu`） |
| `DEPLOY_SSH_HOSTNAME` | Cloudflare Tunnel の SSH ホスト名（例: `ssh.your-domain.com`） |
| `DEPLOY_COMPOSE_DIR` | サーバー上の docker-compose.yml があるディレクトリ（例: `~/house-expense`） |
| `CLOUDFLARE_ACCESS_CLIENT_ID` | サービストークンの Client ID |
| `CLOUDFLARE_ACCESS_CLIENT_SECRET` | サービストークンの Client Secret |

---

## 3. サーバー側の事前確認

```bash
# docker compose が sudo なしで実行できることを確認
docker compose version

# ghcr.io からプルできることを確認（必要に応じてログイン）
docker login ghcr.io -u <GitHubユーザー名> -p <GitHub PAT>
```

イメージがパブリックであれば docker login 不要です。

---

## 4. 動作確認

main ブランチに push すると GitHub Actions の **Actions** タブでジョブが起動します。

1. `Build and Push Docker Image` → ghcr.io へ push
2. `Deploy to Home Server` → SSH 接続 → `docker compose pull app && up -d app`

deploy ジョブが失敗する場合は、**Actions のログ** で SSH の接続エラーや cloudflared のエラーを確認してください。

### よくあるトラブル

| 症状 | 原因 | 対処 |
|---|---|---|
| `cloudflared: connection refused` | Cloudflare Access の Policy 設定ミス | Service Token の Policy を確認 |
| `Permission denied (publickey)` | 公開鍵が `authorized_keys` に未登録 | 手順 1-2 を再確認 |
| `docker compose pull` が失敗 | ghcr.io が private | PAT でログインするか、イメージを public に変更 |
| `cd: No such file or directory` | `DEPLOY_COMPOSE_DIR` のパス間違い | Secret の値を確認（絶対パス推奨） |
