import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { departmentSortKey, positionTopPriority, type Employee } from "@/lib/types";
import EmployeeTable from "./EmployeeTable";
import LeaveNotice from "./LeaveNotice";
import LeaveHistoryList from "./LeaveHistoryList";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  // 휴직 종료일이 지난 직원 자동 복귀 처리 (한국 시간 기준)
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const { data: expiredLeaves } = await supabase
    .from("employees")
    .select("id, leave_end_date")
    .eq("status", "on_leave")
    .not("leave_end_date", "is", null)
    .lte("leave_end_date", today);

  if (expiredLeaves && expiredLeaves.length > 0) {
    for (const e of expiredLeaves) {
      await supabase
        .from("employees")
        .update({
          status: "active",
          return_from_leave_date: e.leave_end_date,
        })
        .eq("id", e.id);
    }
  }

  const year = sp.year ? parseInt(sp.year, 10) : null;

  let query = supabase
    .from("employees")
    .select("*")
    .order("position", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (sp.status && ["active", "on_leave", "resigned"].includes(sp.status)) {
    query = query.eq("status", sp.status);
  } else if (!year) {
    query = query.in("status", ["active", "on_leave"]);
  }

  // 연도별 재직 현황: 해당 연도 중 재직했던 사람
  if (year) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    query = query.or(`hire_date.is.null,hire_date.lte.${yearEnd}`);
    query = query.or(`resignation_date.is.null,resignation_date.gte.${yearStart}`);
  }

  if (sp.q) {
    query = query.or(
      `name.ilike.%${sp.q}%,email.ilike.%${sp.q}%,department.ilike.%${sp.q}%,position.ilike.%${sp.q}%,employee_number.ilike.%${sp.q}%`,
    );
  }

  const { data: employees, error } = await query;

  // 전체 / 재직 페이지 상단에 표시할 휴직자 요약
  const showLeaveNotice = !sp.status || sp.status === "active";
  let onLeaveList: Employee[] = [];
  if (showLeaveNotice) {
    const { data: leaves } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "on_leave")
      .order("leave_end_date", { ascending: true, nullsFirst: false });
    onLeaveList = (leaves ?? []) as Employee[];
  }

  const sorted = ((employees ?? []) as Employee[]).slice().sort((a, b) => {
    // 1. 부사장/본부장은 부서와 무관하게 최상단
    const pa = positionTopPriority(a.position);
    const pb = positionTopPriority(b.position);
    if (pa !== pb) return pa - pb;
    // 2. 부서 커스텀 순서
    const da = departmentSortKey(a.department);
    const db = departmentSortKey(b.department);
    if (da !== db) return da < db ? -1 : 1;
    // 3. 같은 부서 내에서는 파트 가나다순
    const partA = a.part ?? "";
    const partB = b.part ?? "";
    if (partA !== partB) return partA < partB ? -1 : 1;
    return 0; // 같은 파트 내에서는 이미 직급·이름 순으로 정렬됨
  });

  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= 2015; y--) yearOptions.push(y);

  let title =
    sp.status === "active"
      ? "재직 직원"
      : sp.status === "on_leave"
        ? "휴직 직원"
        : sp.status === "resigned"
          ? "퇴직 직원"
          : "전체 직원";
  if (year) title = `${year}년 재직 현황`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {title} <span className="text-base text-gray-500 font-normal">{sorted.length}명</span>
        </h1>
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

      {showLeaveNotice && onLeaveList.length > 0 && (
        <LeaveNotice employees={onLeaveList} />
      )}

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
        <select name="year" defaultValue={sp.year ?? ""} className="w-32">
          <option value="">전체 연도</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
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

      <EmployeeTable employees={sorted} currentStatus={sp.status} />

      {sp.status === "on_leave" && (
        <LeaveHistoryList />
      )}
    </div>
  );
}
