import { createClient } from "@supabase/supabase-js";

// 관리자 권한 클라이언트 — 서버에서만 사용. Service Role Key 필요.
// 사용자 초대/삭제 등 admin API를 호출할 때 사용.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정에서 추가해 주세요.",
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
