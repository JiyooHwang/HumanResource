import Link from "next/link";

export default function Nav({ email }: { email: string }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-gray-900">
            인력 관리
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/employees" className="hover:text-gray-900">전체</Link>
            <Link href="/employees?status=active" className="hover:text-gray-900">재직</Link>
            <Link href="/employees?status=on_leave" className="hover:text-gray-900">휴직</Link>
            <Link href="/employees?status=resigned" className="hover:text-gray-900">퇴직</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
