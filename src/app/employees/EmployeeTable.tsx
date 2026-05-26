"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DepartmentSelect from "@/components/DepartmentSelect";
import HeadquartersSelect from "@/components/HeadquartersSelect";
import ScrollSyncWrapper from "@/components/ScrollSyncWrapper";
import {
  LEAVE_REASON_LABEL,
  type Employee,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

export default function EmployeeTable({
  employees,
  currentStatus,
}: {
  employees: Employee[];
  currentStatus?: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<{ id: string; text: string } | null>(null);

  async function saveField(empId: string, patch: Record<string, unknown>) {
    setSavingId(empId);
    setErrMsg(null);

    // 휴직 날짜 입력 시 자동으로 휴직 상태로 전환
    if (
      (patch.leave_start_date || patch.leave_end_date) &&
      !patch.status
    ) {
      const emp = employees.find((e) => e.id === empId);
      if (emp && emp.status === "active") {
        patch.status = "on_leave";
      }
    }

    const { error } = await supabase.from("employees").update(patch).eq("id", empId);
    setSavingId(null);
    if (error) {
      setErrMsg({ id: empId, text: error.message });
      return false;
    }
    router.refresh();
    return true;
  }

  async function remove(emp: Employee) {
    if (
      !confirm(
        `'${emp.name}' 직원을 삭제할까요?\n체크리스트와 휴직 이력도 함께 삭제됩니다. 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }
    setSavingId(emp.id);
    const { error } = await supabase.from("employees").delete().eq("id", emp.id);
    setSavingId(null);
    if (error) {
      setErrMsg({ id: emp.id, text: error.message });
      return;
    }
    setExpandedId(null);
    router.refresh();
  }

  async function changeStatus(emp: Employee, newStatus: EmployeeStatus) {
    if (newStatus === emp.status) return;
    const patch: Record<string, unknown> = { status: newStatus };
    if (newStatus === "resigned" && !emp.resignation_date) {
      patch.resignation_date = new Date().toISOString().slice(0, 10);
    }
    const ok = await saveField(emp.id, patch);
    if (ok && newStatus === "on_leave") {
      setExpandedId(emp.id); // 휴직 상세 입력을 위해 자동 펼침
    }
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        등록된 직원이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <ScrollSyncWrapper>
      <table className="min-w-[3200px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="whitespace-nowrap">
            <th className="text-left px-3 py-2 w-8"></th>
            <th className="text-left px-3 py-2">입력일</th>
            <th className="text-left px-3 py-2">직원번호</th>
            <th className="text-left px-3 py-2">성명</th>
            <th className="text-left px-3 py-2">본부</th>
            <th className="text-left px-3 py-2">소속</th>
            <th className="text-left px-3 py-2">직책</th>
            <th className="text-left px-3 py-2">근무지</th>
            <th className="text-left px-3 py-2">재직상태</th>
            <th className="text-left px-3 py-2">입사 확정일자</th>
            <th className="text-left px-3 py-2">출근일</th>
            <th className="text-left px-3 py-2">퇴사일</th>
            <th className="text-left px-3 py-2">마지막 근무일</th>
            <th className="text-left px-3 py-2">휴직일자</th>
            <th className="text-left px-3 py-2">휴직종료 예정일</th>
            <th className="text-left px-3 py-2">복직일자</th>
            <th className="text-left px-3 py-2">휴대전화</th>
            <th className="text-left px-3 py-2">사내메일</th>
            <th className="text-left px-3 py-2">외부메일</th>
            <th className="text-left px-3 py-2">비고</th>
            <th className="text-left px-3 py-2">사원증/법인카드</th>
            <th className="text-left px-3 py-2">기간</th>
            <th className="text-left px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <Row
              key={emp.id}
              emp={emp}
              isExpanded={expandedId === emp.id}
              saving={savingId === emp.id}
              errorText={errMsg?.id === emp.id ? errMsg.text : null}
              onToggleExpand={() =>
                setExpandedId((id) => (id === emp.id ? null : emp.id))
              }
              onSaveField={(patch) => saveField(emp.id, patch)}
              onChangeStatus={(s) => changeStatus(emp, s)}
              onDelete={() => remove(emp)}
            />
          ))}
        </tbody>
      </table>
      </ScrollSyncWrapper>
    </div>
  );
}

function Row({
  emp,
  isExpanded,
  saving,
  errorText,
  onToggleExpand,
  onSaveField,
  onChangeStatus,
  onDelete,
}: {
  emp: Employee;
  isExpanded: boolean;
  saving: boolean;
  errorText: string | null;
  onToggleExpand: () => void;
  onSaveField: (patch: Record<string, unknown>) => Promise<boolean>;
  onChangeStatus: (s: EmployeeStatus) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-3 py-2 align-middle">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-700 w-6 h-6 flex items-center justify-center"
            aria-label={isExpanded ? "접기" : "상세/삭제"}
            title="상세 / 삭제"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        </td>
        {/* 입력일 */}
        <td className="px-2 py-1 align-middle min-w-[8rem] whitespace-nowrap text-gray-500 text-xs">
          {emp.created_at ? new Date(emp.created_at).toLocaleDateString("ko-KR") : "-"}
        </td>
        {/* 직원번호 */}
        <td className="px-2 py-1 align-middle min-w-[7rem] whitespace-nowrap">
          <CellText
            value={emp.employee_number ?? ""}
            onSave={(v) => onSaveField({ employee_number: v || null })}
            placeholder="-"
          />
        </td>
        {/* 성명 */}
        <td className="px-3 py-2 align-middle whitespace-nowrap">
          <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline">
            {emp.name}
          </Link>
        </td>
        {/* 본부 */}
        <td className="px-2 py-1 align-middle min-w-[14rem] whitespace-nowrap">
          <CellHeadquarters
            value={emp.headquarters ?? ""}
            onSave={(v) => onSaveField({ headquarters: v || null })}
          />
        </td>
        {/* 소속 */}
        <td className="px-2 py-1 align-middle min-w-[16rem] whitespace-nowrap">
          <CellDepartment
            value={emp.department ?? ""}
            onSave={(v) => onSaveField({ department: v || null })}
          />
        </td>
        {/* 직책 */}
        <td className="px-2 py-1 align-middle min-w-[8rem] whitespace-nowrap">
          <CellText
            value={emp.position ?? ""}
            onSave={(v) => onSaveField({ position: v || null })}
            placeholder="-"
          />
        </td>
        {/* 근무지 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText
            value={emp.work_location ?? ""}
            onSave={(v) => onSaveField({ work_location: v || null })}
            placeholder="-"
          />
        </td>
        {/* 재직상태 */}
        <td className="px-2 py-1 align-middle min-w-[7rem] whitespace-nowrap">
          <select
            value={emp.status}
            onChange={(e) => onChangeStatus(e.target.value as EmployeeStatus)}
            className="text-sm !py-1 !px-2 min-w-[6rem]"
            disabled={saving}
          >
            <option value="active">재직</option>
            <option value="on_leave">휴직</option>
            <option value="resigned">퇴직</option>
          </select>
        </td>
        {/* 입사 확정일자 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.hire_date ?? ""} onSave={(v) => onSaveField({ hire_date: v || null })} />
        </td>
        {/* 출근일 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.first_work_date ?? ""} onSave={(v) => onSaveField({ first_work_date: v || null })} />
        </td>
        {/* 퇴사일 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.resignation_date ?? ""} onSave={(v) => onSaveField({ resignation_date: v || null })} />
        </td>
        {/* 마지막 근무일 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.last_work_date ?? ""} onSave={(v) => onSaveField({ last_work_date: v || null })} />
        </td>
        {/* 휴직일자 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.leave_start_date ?? ""} onSave={(v) => onSaveField({ leave_start_date: v || null })} />
        </td>
        {/* 휴직종료 예정일 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.leave_end_date ?? ""} onSave={(v) => onSaveField({ leave_end_date: v || null })} />
        </td>
        {/* 복직일자 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText type="date" value={emp.return_from_leave_date ?? ""} onSave={(v) => onSaveField({ return_from_leave_date: v || null })} />
        </td>
        {/* 휴대전화 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText value={emp.phone ?? ""} onSave={(v) => onSaveField({ phone: v || null })} placeholder="-" />
        </td>
        {/* 사내메일 */}
        <td className="px-2 py-1 align-middle min-w-[14rem] whitespace-nowrap">
          <CellText value={emp.email ?? ""} onSave={(v) => onSaveField({ email: v || null })} placeholder="-" />
        </td>
        {/* 외부메일 */}
        <td className="px-2 py-1 align-middle min-w-[14rem] whitespace-nowrap">
          <CellText value={emp.personal_email ?? ""} onSave={(v) => onSaveField({ personal_email: v || null })} placeholder="-" />
        </td>
        {/* 비고 */}
        <td className="px-2 py-1 align-middle min-w-[10rem] whitespace-nowrap">
          <CellText value={emp.notes ?? ""} onSave={(v) => onSaveField({ notes: v || null })} placeholder="-" />
        </td>
        {/* 사원증/법인카드 반납 */}
        <td className="px-2 py-1 align-middle min-w-[8rem] whitespace-nowrap">
          <CellText value={emp.badge_card_returned ?? ""} onSave={(v) => onSaveField({ badge_card_returned: v || null })} placeholder="-" />
        </td>
        {/* 기간 (근속) */}
        <td className="px-2 py-1 align-middle min-w-[8rem] whitespace-nowrap">
          <span className="text-gray-700" title="입사일 기준 근속 기간">
            {calcTenure(emp.hire_date)}
          </span>
        </td>
        {/* 삭제 */}
        <td className="px-2 py-1 align-middle whitespace-nowrap">
          <button
            type="button"
            onClick={onDelete}
            className="text-gray-300 hover:text-red-600 text-xs"
            title="직원 삭제"
          >
            ✕
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={23} className="px-4 py-3">
            <ExpandedArea emp={emp} onSaveField={onSaveField} onDelete={onDelete} />
            {errorText && (
              <p className="text-sm text-red-700 mt-2">오류: {errorText}</p>
            )}
          </td>
        </tr>
      )}
      {!isExpanded && errorText && (
        <tr>
          <td colSpan={23} className="px-4 py-1 text-sm text-red-700">
            오류: {errorText}
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedArea({
  emp,
  onSaveField,
  onDelete,
}: {
  emp: Employee;
  onSaveField: (patch: Record<string, unknown>) => Promise<boolean>;
  onDelete: () => void;
}) {
  if (emp.status === "on_leave") {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-yellow-900">휴직 정보</div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[10rem]">
            <label className="text-xs">휴직 시작일</label>
            <CellText
              type="date"
              value={emp.leave_start_date ?? ""}
              onSave={(v) => onSaveField({ leave_start_date: v || null })}
            />
          </div>
          <div className="min-w-[10rem]">
            <label className="text-xs">휴직 종료(예정)일</label>
            <CellText
              type="date"
              value={emp.leave_end_date ?? ""}
              onSave={(v) => onSaveField({ leave_end_date: v || null })}
            />
          </div>
          <div className="min-w-[8rem]">
            <label className="text-xs">사유</label>
            <select
              value={emp.leave_reason ?? ""}
              onChange={(e) =>
                onSaveField({ leave_reason: e.target.value || null })
              }
            >
              <option value="">선택</option>
              {(Object.keys(LEAVE_REASON_LABEL) as LeaveReason[]).map((k) => (
                <option key={k} value={k}>
                  {LEAVE_REASON_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          {emp.leave_reason === "other" && (
            <div className="min-w-[12rem]">
              <label className="text-xs">기타 사유</label>
              <CellText
                value={emp.leave_reason_detail ?? ""}
                onSave={(v) => onSaveField({ leave_reason_detail: v || null })}
                placeholder="직접 입력"
              />
            </div>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-2 rounded-md ml-auto"
          >
            직원 삭제
          </button>
        </div>
        <p className="text-xs text-gray-500">
          ⓘ 상태를 휴직이 아닌 값으로 바꾸면 현재 휴직 정보가 자동으로 휴직 이력에 보관됩니다.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/employees/${emp.id}`}
        className="text-sm text-gray-500 hover:text-gray-800"
      >
        상세 페이지로 →
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-2 rounded-md ml-auto"
      >
        직원 삭제
      </button>
    </div>
  );
}

function formatLeavePeriod(e: Employee): string {
  const start = e.leave_start_date ?? "?";
  const end = e.leave_end_date ?? "미정";
  if (!e.leave_start_date && !e.leave_end_date) return "기간 입력 ✎";
  return `${start} ~ ${end} ✎`;
}

function calcTenure(hireDate: string | null): string {
  if (!hireDate) return "-";
  const start = new Date(hireDate);
  if (isNaN(start.getTime())) return "-";
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return "-"; // 미래 입사일
  if (years === 0 && months === 0) return "1개월 미만";
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}년`);
  if (months > 0) parts.push(`${months}개월`);
  return parts.join(" ");
}

/** 텍스트/날짜 인라인 셀 — 포커스 잃으면 변경된 경우 저장 */
function CellText({
  value,
  onSave,
  type = "text",
  placeholder,
}: {
  value: string;
  onSave: (v: string) => Promise<boolean> | void;
  type?: "text" | "date";
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);

  async function commit() {
    setFocused(false);
    if (local === value) return;
    const ok = await onSave(local);
    if (ok !== false) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(0), 1200);
    }
  }

  return (
    <div className="relative">
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setLocal(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        className="!py-1 !px-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white rounded"
      />
      {savedAt > 0 && (
        <span className="absolute -right-1 top-1 text-green-600 text-xs">✓</span>
      )}
    </div>
  );
}

function CellDepartment({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => Promise<boolean> | void;
}) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);

  async function commit() {
    setFocused(false);
    if (local === value) return;
    const ok = await onSave(local);
    if (ok !== false) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(0), 1200);
    }
  }

  return (
    <div
      className="relative"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={commit}
    >
      <DepartmentSelect
        value={local}
        onChange={setLocal}
        className="!py-1 !px-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white rounded"
      />
      {savedAt > 0 && (
        <span className="absolute -right-1 top-1 text-green-600 text-xs">✓</span>
      )}
    </div>
  );
}

function CellHeadquarters({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => Promise<boolean> | void;
}) {
  const [local, setLocal] = useState(value);
  const [focused, setFocused] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);

  async function commit() {
    setFocused(false);
    if (local === value) return;
    const ok = await onSave(local);
    if (ok !== false) {
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(0), 1200);
    }
  }

  return (
    <div
      className="relative"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={commit}
    >
      <HeadquartersSelect
        value={local}
        onChange={setLocal}
        className="!py-1 !px-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white rounded"
      />
      {savedAt > 0 && (
        <span className="absolute -right-1 top-1 text-green-600 text-xs">✓</span>
      )}
    </div>
  );
}
