import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // 認証不要なパスを除外: api/auth, _next静的ファイル, favicon, auth画面
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)"],
};
