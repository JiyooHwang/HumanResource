import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { departmentSortKey, type Employee } from "@/lib/types";
import EmployeeTable from "./EmployeeTable";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // 1차 정렬은 JS에서 커스텀 부서 순서로 적용 (Supabase에서는 직급/이름만 미리 정렬)
  let query = supabase
    .from("employees")
    .select("*")
    .order("position", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (sp.status && ["active", "on_leave", "resigned"].includes(sp.status)) {
    query = query.eq("status", sp.status);
  }
  if (sp.q) {
    query = query.or(
      `name.ilike.%${sp.q}%,email.ilike.%${sp.q}%,department.ilike.%${sp.q}%,position.ilike.%${sp.q}%,employee_number.ilike.%${sp.q}%`,
    );
  }

  const { data: employees, error } = await query;

  const sorted = ((employees ?? []) as Employee[]).slice().sort((a, b) => {
    const da = departmentSortKey(a.department);
    const db = departmentSortKey(b.department);
    if (da !== db) return da < db ? -1 : 1;
    return 0; // 이미 직급·이름 순으로 정렬되어 있음
  });

  const title =
    sp.status === "active"
      ? "재직 직원"
      : sp.status === "on_leave"
        ? "휴직 직원"
        : sp.status === "resigned"
          ? "퇴직 직원"
          : "전체 직원";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex gap-2">
          <a
            href={`/api/employees/export${sp.status ? `?status=${sp.status}` : ""}`}
            className="bg-white border border-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-50"
          >
            CSV 내보내기
          </a>
          <Link
            href="/employees/import"
            className="bg-white border border-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-50"
          >
            엑셀 가져오기
          </Link>
          <Link
            href="/employees/new"
            className="bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"
          >
            + 직원 등록
          </Link>
        </div>
      </div>

      <form className="flex gap-2" action="/employees">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="이름, 이메일, 부서, 사번 검색"
          className="flex-1"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="w-32">
          <option value="">전체 상태</option>
          <option value="active">재직</option>
          <option value="on_leave">휴직</option>
          <option value="resigned">퇴직</option>
        </select>
        <button
          type="submit"
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800"
        >
          검색
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-md">
          {error.message} — Supabase 스키마가 적용됐는지 확인하세요.
        </div>
      )}

      <p className="text-xs text-gray-500">
        ▸ 아이콘을 클릭하면 상태/휴직 정보를 바로 편집할 수 있습니다.
      </p>

      <EmployeeTable employees={sorted} />
    </div>
  );
}
