import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<EmployeeStatus, string> = {
  active: "재직",
  on_leave: "휴직",
  resigned: "퇴직",
};

const statusBadge: Record<EmployeeStatus, string> = {
  active: "bg-green-100 text-green-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  resigned: "bg-gray-200 text-gray-700",
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("employees").select("*").order("created_at", { ascending: false });

  if (sp.status && ["active", "on_leave", "resigned"].includes(sp.status)) {
    query = query.eq("status", sp.status);
  }
  if (sp.q) {
    query = query.or(
      `name.ilike.%${sp.q}%,email.ilike.%${sp.q}%,department.ilike.%${sp.q}%,position.ilike.%${sp.q}%,employee_number.ilike.%${sp.q}%`,
    );
  }

  const { data: employees, error } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">직원</h1>
        <div className="flex gap-2">
          <a
            href={`/api/employees/export${sp.status ? `?status=${sp.status}` : ""}`}
            className="bg-white border border-gray-300 text-sm px-3 py-2 rounded-md hover:bg-gray-50"
          >
            CSV 내보내기
          </a>
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">이름</th>
              <th className="text-left px-4 py-2">사번</th>
              <th className="text-left px-4 py-2">부서</th>
              <th className="text-left px-4 py-2">직급</th>
              <th className="text-left px-4 py-2">입사일</th>
              <th className="text-left px-4 py-2">퇴사일</th>
              <th className="text-left px-4 py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {(employees as Employee[] | null)?.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/employees/${e.id}`} className="text-blue-600 hover:underline">
                    {e.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-700">{e.employee_number ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{e.department ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{e.position ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{e.hire_date ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{e.resignation_date ?? "-"}</td>
                <td className="px-4 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusBadge[e.status]}`}>
                    {statusLabel[e.status]}
                  </span>
                </td>
              </tr>
            ))}
            {employees && employees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  등록된 직원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
