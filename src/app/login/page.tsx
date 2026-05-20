"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("가입 완료. 이메일 확인이 필요한 경우 메일함을 확인하세요.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white border border-gray-200 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-1">인력 관리</h1>
      <p className="text-sm text-gray-500 mb-4">팀원 계정으로 로그인하세요.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label>이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        {mode === "signin" ? "팀원 신규 가입" : "기존 계정으로 로그인"}
      </button>

      {message && (
        <p className="mt-4 text-sm text-red-600 whitespace-pre-line">{message}</p>
      )}
    </div>
  );
}
