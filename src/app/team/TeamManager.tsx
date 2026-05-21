"use client";

import { useEffect, useState } from "react";

type TeamUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  invited_at: string | null;
};

export default function TeamManager() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/team");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "로드 실패");
      return;
    }
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setInviting(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setInviting(false);
    if (!res.ok) {
      setMsg(`오류: ${data.error}`);
      return;
    }
    setMsg(`초대 메일을 ${email} 으로 보냈습니다.`);
    setEmail("");
    load();
  }

  async function remove(u: TeamUser) {
    if (!confirm(`'${u.email}' 계정을 삭제할까요? 해당 사용자는 더 이상 로그인할 수 없습니다.`)) {
      return;
    }
    const res = await fetch(`/api/team?id=${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "삭제 실패");
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-medium mb-2">새 팀원 초대</h2>
        <form onSubmit={invite} className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
          >
            {inviting ? "전송 중..." : "초대 메일 보내기"}
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
        <p className="mt-2 text-xs text-gray-500">
          초대받은 사람은 메일 안 링크를 클릭해 비밀번호를 설정하면 로그인할 수 있습니다.
        </p>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-medium">현재 팀원 {users.length}명</h2>
          <button
            onClick={load}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-2 py-1 rounded"
          >
            새로고침
          </button>
        </div>
        {error && (
          <div className="m-4 text-sm bg-red-50 border border-red-200 text-red-800 p-3 rounded">
            {error}
            {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
              <div className="mt-2 text-xs">
                Vercel 프로젝트 설정 → Environment Variables 에 SUPABASE_SERVICE_ROLE_KEY를 추가하고 재배포하세요.
              </div>
            )}
          </div>
        )}
        {loading ? (
          <p className="p-4 text-sm text-gray-500">불러오는 중...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">이메일</th>
                <th className="text-left px-4 py-2">상태</th>
                <th className="text-left px-4 py-2">초대일</th>
                <th className="text-left px-4 py-2">최근 로그인</th>
                <th className="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    {u.confirmed ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        활성
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                        초대됨 (미가입)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {u.invited_at
                      ? new Date(u.invited_at).toLocaleDateString("ko-KR")
                      : new Date(u.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => remove(u)}
                      className="text-xs text-red-600 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
