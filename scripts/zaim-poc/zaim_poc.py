#!/usr/bin/env python3
"""
Zaim API PoC スクリプト

設計検討メモ (docs/zaim-auto-import-design.md) の Go/No-Go 判断のため、
実アカウントで Zaim API から取得できるデータを確認する。

使い方:
  1. pip install -r requirements.txt
  2. .env.example を .env にコピーし、コンシューマ情報を記入
  3. python zaim_poc.py authorize   ← アクセストークンを取得 (.env に自動書込み)
  4. python zaim_poc.py fetch        ← データ取得 & Go/No-Go 判定
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from requests_oauthlib import OAuth1Session

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------
ZAIM_API_BASE = "https://api.zaim.net/v2"
REQUEST_TOKEN_URL = f"{ZAIM_API_BASE}/auth/request"
AUTHORIZE_URL = "https://auth.zaim.net/users/auth"
ACCESS_TOKEN_URL = f"{ZAIM_API_BASE}/auth/access"
CALLBACK_URI = "http://127.0.0.1:5000/callback"

# ---------------------------------------------------------------------------
# ユーティリティ
# ---------------------------------------------------------------------------

def load_env() -> None:
    """スクリプトディレクトリの .env を読み込む"""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        print("[ERROR] .env ファイルが見つかりません。")
        print("        .env.example を .env にコピーし、値を記入してください。")
        sys.exit(1)
    load_dotenv(env_path)


def get_env(key: str) -> str:
    value = os.environ.get(key, "").strip()
    if not value:
        print(f"[ERROR] 環境変数 {key} が未設定です。.env を確認してください。")
        sys.exit(1)
    return value


def make_session(
    consumer_key: str,
    consumer_secret: str,
    access_token: str | None = None,
    access_token_secret: str | None = None,
) -> OAuth1Session:
    return OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=access_token,
        resource_owner_secret=access_token_secret,
    )


def pretty(data: object) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False, default=str)


# ---------------------------------------------------------------------------
# サブコマンド: authorize
# ---------------------------------------------------------------------------

def cmd_authorize() -> None:
    """OAuth 1.0a フローでアクセストークンを取得する"""
    load_env()
    consumer_key = get_env("ZAIM_CONSUMER_KEY")
    consumer_secret = get_env("ZAIM_CONSUMER_SECRET")

    # 1. Request Token
    session = OAuth1Session(consumer_key, client_secret=consumer_secret, callback_uri=CALLBACK_URI)
    resp = session.fetch_request_token(REQUEST_TOKEN_URL)
    request_token = resp["oauth_token"]
    request_token_secret = resp["oauth_token_secret"]

    # 2. ユーザーに認可 URL を提示
    auth_url = session.authorization_url(AUTHORIZE_URL)
    print()
    print("=" * 60)
    print(" 以下の URL をブラウザで開き、Zaim にログインして認可してください。")
    print("=" * 60)
    print()
    print(f"  {auth_url}")
    print()
    print(" 認可後、リダイレクト先 URL に含まれる oauth_verifier を入力してください。")
    print(" (リダイレクト先が開けなくても、URL バーに表示される値をコピーしてください)")
    print()

    verifier = input("oauth_verifier: ").strip()
    if not verifier:
        print("[ERROR] oauth_verifier が空です。")
        sys.exit(1)

    # 3. Access Token
    session = OAuth1Session(
        consumer_key,
        client_secret=consumer_secret,
        resource_owner_key=request_token,
        resource_owner_secret=request_token_secret,
        verifier=verifier,
    )
    resp = session.fetch_access_token(ACCESS_TOKEN_URL)
    access_token = resp["oauth_token"]
    access_token_secret = resp["oauth_token_secret"]

    # .env に書き込み
    env_path = Path(__file__).resolve().parent / ".env"
    _update_env_file(env_path, {
        "ZAIM_ACCESS_TOKEN": access_token,
        "ZAIM_ACCESS_TOKEN_SECRET": access_token_secret,
    })

    print()
    print("=" * 60)
    print(" アクセストークンを取得し、.env に書き込みました。")
    print(" 次のコマンドでデータを取得できます:")
    print("   python zaim_poc.py fetch")
    print("=" * 60)
    print()


def _update_env_file(env_path: Path, updates: dict[str, str]) -> None:
    """既存の .env ファイル内の指定キーを更新する。キーがなければ末尾に追加する。"""
    if not env_path.exists():
        lines: list[str] = []
    else:
        lines = env_path.read_text(encoding="utf-8").splitlines(keepends=True)

    for key, value in updates.items():
        pattern = re.compile(rf'^{re.escape(key)}=.*', re.MULTILINE)
        new_line = f'{key}="{value}"'
        found = False
        for i, line in enumerate(lines):
            if pattern.match(line.rstrip("\n\r")):
                lines[i] = new_line + "\n"
                found = True
                break
        if not found:
            if lines and not lines[-1].endswith("\n"):
                lines.append("\n")
            lines.append(new_line + "\n")

    env_path.write_text("".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# サブコマンド: fetch
# ---------------------------------------------------------------------------

def cmd_fetch() -> None:
    """Zaim API からデータを取得し、Go/No-Go 判定に必要な情報を出力する"""
    load_env()
    consumer_key = get_env("ZAIM_CONSUMER_KEY")
    consumer_secret = get_env("ZAIM_CONSUMER_SECRET")
    access_token = get_env("ZAIM_ACCESS_TOKEN")
    access_token_secret = get_env("ZAIM_ACCESS_TOKEN_SECRET")

    session = make_session(consumer_key, consumer_secret, access_token, access_token_secret)

    print()
    print("=" * 70)
    print(" Zaim API PoC — データ取得 & Go/No-Go 判定")
    print("=" * 70)

    # ------------------------------------------------------------------
    # 1. ユーザー認証確認
    # ------------------------------------------------------------------
    print()
    print("-" * 70)
    print("[1/5] ユーザー認証確認 (GET /home/user/verify)")
    print("-" * 70)
    resp = session.get(f"{ZAIM_API_BASE}/home/user/verify")
    if resp.status_code != 200:
        print(f"[ERROR] ステータス {resp.status_code}: {resp.text}")
        sys.exit(1)
    user_data = resp.json()
    print(pretty(user_data))

    # ------------------------------------------------------------------
    # 2. 口座一覧
    # ------------------------------------------------------------------
    print()
    print("-" * 70)
    print("[2/5] 口座一覧 (GET /home/account)")
    print("-" * 70)
    resp = session.get(f"{ZAIM_API_BASE}/home/account")
    account_data = resp.json()
    accounts = account_data.get("accounts", [])
    print(f"取得件数: {len(accounts)}")
    print()
    print(pretty(account_data))

    # ------------------------------------------------------------------
    # 3. カテゴリ一覧
    # ------------------------------------------------------------------
    print()
    print("-" * 70)
    print("[3/5] カテゴリ一覧 (GET /home/category)")
    print("-" * 70)
    resp = session.get(f"{ZAIM_API_BASE}/home/category")
    category_data = resp.json()
    categories = category_data.get("categories", [])
    print(f"取得件数: {len(categories)}")
    print()
    print(pretty(category_data))

    # ------------------------------------------------------------------
    # 4. ジャンル一覧
    # ------------------------------------------------------------------
    print()
    print("-" * 70)
    print("[4/5] ジャンル一覧 (GET /home/genre)")
    print("-" * 70)
    resp = session.get(f"{ZAIM_API_BASE}/home/genre")
    genre_data = resp.json()
    genres = genre_data.get("genres", [])
    print(f"取得件数: {len(genres)}")
    print()
    print(pretty(genre_data))

    # ------------------------------------------------------------------
    # 5. 明細取得 (money)
    # ------------------------------------------------------------------
    print()
    print("-" * 70)
    print("[5/5] 明細取得 (GET /home/money)")
    print("-" * 70)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=60)
    params = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "limit": 100,
        "page": 1,
    }
    print(f"取得期間: {params['start_date']} 〜 {params['end_date']}")
    print()

    resp = session.get(f"{ZAIM_API_BASE}/home/money", params=params)
    money_data = resp.json()
    money_list = money_data.get("money", [])
    print(f"取得件数: {len(money_list)}")
    print()

    # 全件出力すると長いので、先頭 5 件を詳細表示
    for i, item in enumerate(money_list[:5]):
        print(f"--- 明細 {i + 1} ---")
        print(pretty(item))
        print()

    if len(money_list) > 5:
        print(f"... 残り {len(money_list) - 5} 件は省略")
        print()

    # ------------------------------------------------------------------
    # Go/No-Go 判定
    # ------------------------------------------------------------------
    print()
    print("=" * 70)
    print(" Go/No-Go 判定チェックリスト")
    print("=" * 70)
    print()

    run_go_nogo_check(accounts, categories, genres, money_list)


def run_go_nogo_check(
    accounts: list,
    categories: list,
    genres: list,
    money_list: list,
) -> None:
    """取得データを検証し、Go/No-Go 判断に必要な項目を出力する"""
    checks: list[tuple[str, bool, str]] = []

    # --- Check 1: 口座に id があるか ---
    has_account_id = bool(accounts) and all("id" in a for a in accounts)
    checks.append((
        "口座 (account) に一意な id が存在する",
        has_account_id,
        "DataSource との 1:1 マッピングに必要",
    ))

    # --- Check 2: 口座に name があるか ---
    has_account_name = bool(accounts) and all("name" in a for a in accounts)
    checks.append((
        "口座 (account) に name が存在する",
        has_account_name,
        "DataSource.name への対応に必要",
    ))

    # --- Check 3: money に一意 id があるか ---
    has_money_id = bool(money_list) and all("id" in m for m in money_list)
    checks.append((
        "明細 (money) に一意な id が存在する",
        has_money_id,
        "externalTransactionId として重複/更新検知に必要",
    ))

    # --- Check 4: money に date があるか ---
    has_money_date = bool(money_list) and all("date" in m for m in money_list)
    checks.append((
        "明細 (money) に date が存在する",
        has_money_date,
        "Transaction.usageDate へのマッピングに必要",
    ))

    # --- Check 5: money に amount があるか ---
    has_money_amount = bool(money_list) and all(
        "amount" in m or "price" in m for m in money_list
    )
    checks.append((
        "明細 (money) に amount または price が存在する",
        has_money_amount,
        "Transaction.amount へのマッピングに必要",
    ))

    # --- Check 6: money に mode/type があるか ---
    has_money_mode = bool(money_list) and all("mode" in m for m in money_list)
    checks.append((
        "明細 (money) に mode (payment/income/transfer) が存在する",
        has_money_mode,
        "Transaction.type へのマッピングに必要",
    ))

    # --- Check 7: money に from_account_id / to_account_id があるか ---
    has_account_ref = bool(money_list) and all(
        "from_account_id" in m or "to_account_id" in m for m in money_list
    )
    checks.append((
        "明細 (money) に from_account_id / to_account_id が存在する",
        has_account_ref,
        "Transaction.dataSourceId (口座紐付け) に必要",
    ))

    # --- Check 8: money に説明文系フィールドがあるか ---
    desc_fields = {"comment", "place", "name"}
    has_desc = bool(money_list) and all(
        any(f in m for f in desc_fields) for m in money_list
    )
    checks.append((
        "明細 (money) に comment / place / name のいずれかが存在する",
        has_desc,
        "Transaction.description へのマッピングに必要",
    ))

    # --- Check 9: money に created/modified タイムスタンプがあるか ---
    has_timestamps = bool(money_list) and all(
        "created" in m or "modified" in m for m in money_list
    )
    checks.append((
        "明細 (money) に created / modified タイムスタンプが存在する",
        has_timestamps,
        "更新検知 (sourceUpdatedAt 相当) に必要。なくても hashKey で代替は可能",
    ))

    # --- Check 10: money に category_id / genre_id があるか ---
    has_category = bool(money_list) and all(
        "category_id" in m or "genre_id" in m for m in money_list
    )
    checks.append((
        "明細 (money) に category_id / genre_id が存在する",
        has_category,
        "カテゴリ自動マッピングに必要 (なくても運用可能)",
    ))

    # --- 結果出力 ---
    all_pass = True
    critical_fail = False
    for label, passed, reason in checks:
        icon = "✅" if passed else "❌"
        print(f"  {icon} {label}")
        print(f"      理由: {reason}")
        if not passed:
            all_pass = False
            # Check 1, 3, 4, 5, 6 は致命的
            if any(
                label.startswith(x) for x in [
                    "口座 (account) に一意な id",
                    "明細 (money) に一意な id",
                    "明細 (money) に date",
                    "明細 (money) に amount",
                    "明細 (money) に mode",
                ]
            ):
                critical_fail = True
        print()

    print("=" * 70)
    if not money_list:
        print(" ⚠️  判定: 明細が 0 件のため判定不可")
        print("    直近 60 日に Zaim 上のデータがあるか確認してください。")
        print("    手動で 1 件以上登録してから再実行してください。")
    elif critical_fail:
        print(" ❌ 判定: No-Go")
        print("    必須フィールドが不足しています。")
        print("    設計メモの「No-Go / 要再検討」条件に該当します。")
    elif all_pass:
        print(" ✅ 判定: Go")
        print("    必要なフィールドがすべて確認できました。")
        print("    実装に進めます。")
    else:
        print(" ⚠️  判定: 条件付き Go")
        print("    一部のフィールドが欠落していますが、致命的ではありません。")
        print("    不足項目については代替手段を検討してください。")
    print("=" * 70)
    print()

    # --- マッピングサマリ ---
    print()
    print("=" * 70)
    print(" 参考: Zaim → house-expense マッピング案")
    print("=" * 70)
    print()
    print("  Zaim フィールド             → house-expense カラム")
    print("  ─────────────────────────────────────────────────")
    print("  money.id                    → Transaction.externalTransactionId (新規追加)")
    print("  money.date                  → Transaction.usageDate")
    print("  money.amount / money.price  → Transaction.amount")
    print("  money.mode                  → Transaction.type")
    print("    payment                     → expense")
    print("    income                      → income")
    print("    transfer                    → transfer")
    print("  money.from_account_id       → Transaction.dataSourceId (via DataSource)")
    print("  money.comment + place + name→ Transaction.description")
    print("  money.category_id           → (参考: Zaim 独自カテゴリ)")
    print("  money.genre_id              → (参考: Zaim 独自ジャンル)")
    print("  money.created / modified    → Transaction.sourceUpdatedAt (新規追加)")
    print()
    print("  account.id                  → DataSource.externalAccountId (新規追加)")
    print("  account.name                → DataSource.name")
    print()

    # --- 明細の mode 別件数 ---
    if money_list:
        print()
        print("=" * 70)
        print(" 参考: 取得明細の mode 別集計")
        print("=" * 70)
        mode_counts = Counter(m.get("mode", "(不明)") for m in money_list)
        for mode, count in sorted(mode_counts.items()):
            print(f"  {mode}: {count} 件")
        print()

    # --- 口座サマリ ---
    if money_list:
        print()
        print("=" * 70)
        print(" 参考: 明細に現れる口座 ID 一覧")
        print("=" * 70)
        from_ids: set[str] = set()
        to_ids: set[str] = set()
        for m in money_list:
            fid = m.get("from_account_id")
            tid = m.get("to_account_id")
            if fid and str(fid) != "0":
                from_ids.add(str(fid))
            if tid and str(tid) != "0":
                to_ids.add(str(tid))
        all_ids = from_ids | to_ids
        print(f"  from_account_id に現れた口座: {sorted(from_ids) if from_ids else '(なし)'}")
        print(f"  to_account_id   に現れた口座: {sorted(to_ids) if to_ids else '(なし)'}")
        print(f"  ユニーク口座数: {len(all_ids)}")
        print()


# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("authorize", "fetch"):
        print("Usage: python zaim_poc.py <command>")
        print()
        print("Commands:")
        print("  authorize  OAuth 1.0a フローでアクセストークンを取得する")
        print("  fetch      Zaim API からデータを取得し、Go/No-Go 判定を行う")
        sys.exit(1)

    command = sys.argv[1]
    if command == "authorize":
        cmd_authorize()
    elif command == "fetch":
        cmd_fetch()


if __name__ == "__main__":
    main()
