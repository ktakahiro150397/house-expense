import Link from "next/link";
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">家計簿アプリ</h1>
      {session?.user ? (
        <div className="mt-4 space-y-2">
          <p className="text-gray-600">
            ログイン中: <span className="font-medium">{session.user.email}</span>
          </p>
          {session.user.name && (
            <p className="text-gray-500 text-sm">{session.user.name}</p>
          )}
          <Link
            href="/import"
            className="inline-block mt-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            CSVインポート
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="mt-2 px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              ログアウト
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-2 text-gray-600">未ログイン</p>
      )}
    </main>
  );
}
