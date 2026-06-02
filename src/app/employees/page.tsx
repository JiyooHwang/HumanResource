import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { departmentSortKey, headquartersSortKey, positionRankWithinDept, positionTopPriority, type Employee } from "@/lib/types";
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
  // 휴직 종료일이 지난 직원 자동 복귀 처리 (비동기, 페이지 로드 안 막음)
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  void supabase
    .from("employees")
    .update({ status: "active", return_from_leave_date: today })
    .eq("status", "on_leave")
    .not("leave_end_date", "is", null)
    .lte("leave_end_date", today);

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

  // 재직 페이지에 표시할 휴직자 요약 (필요한 컬럼만)
  const showLeaveNotice = !sp.status || sp.status === "active";
  let onLeaveList: Employee[] = [];
  if (showLeaveNotice) {
    const { data: leaves } = await supabase
      .from("employees")
      .select("id, name, department, part, position, leave_start_date, leave_end_date, leave_reason, leave_reason_detail, status")
      .eq("status", "on_leave")
      .order("leave_end_date", { ascending: true, nullsFirst: false });
    onLeaveList = (leaves ?? []) as Employee[];
  }

  const sorted = ((employees ?? []) as Employee[]).slice().sort((a, b) => {
    // 1. 부사장/본부장은 최상단
    const pa = positionTopPriority(a.position);
    const pb = positionTopPriority(b.position);
    if (pa !== pb) return pa - pb;
    // 2. 본부별 정렬
    const ha = headquartersSortKey(a.headquarters);
    const hb = headquartersSortKey(b.headquarters);
    if (ha !== hb) return ha < hb ? -1 : 1;
    // 3. 같은 본부 내 소속(팀) 커스텀 순서
    const da = departmentSortKey(a.department);
    const db = departmentSortKey(b.department);
    if (da !== db) return da < db ? -1 : 1;
    // 4. 같은 소속 내 파트 가나다순
    const partA = a.part ?? "";
    const partB = b.part ?? "";
    if (partA !== partB) return partA < partB ? -1 : 1;
    // 5. 같은 파트 안에서 직책 순서 (실장 > 팀장 > 파트장)
    const wa = positionRankWithinDept(a.position);
    const wb = positionRankWithinDept(b.position);
    if (wa !== wb) return wa - wb;
    return 0;
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
