/**
 * 管理者判定
 * 環境変数 ADMIN_EMAILS にカンマ区切りでメールアドレスを設定してください。
 * 例: ADMIN_EMAILS=admin@example.com,another@example.com
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const admins = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return admins.includes(email);
}
