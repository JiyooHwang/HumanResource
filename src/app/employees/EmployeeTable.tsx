"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DepartmentSelect from "@/components/DepartmentSelect";
import {
  LEAVE_REASON_LABEL,
  type Employee,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<{ id: string; text: string } | null>(null);

  async function saveField(empId: string, patch: Record<string, unknown>) {
    setSavingId(empId);
    setErrMsg(null);
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="min-w-[1200px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="whitespace-nowrap">
            <th className="text-left px-3 py-2 w-8"></th>
            <th className="text-left px-3 py-2">이름</th>
            <th className="text-left px-3 py-2">사번</th>
            <th className="text-left px-3 py-2">부서</th>
            <th className="text-left px-3 py-2">파트</th>
            <th className="text-left px-3 py-2">직급</th>
            <th className="text-left px-3 py-2">입사일</th>
            <th className="text-left px-3 py-2">상태</th>
            <th className="text-left px-3 py-2">기간 / 퇴사일</th>
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
            aria-label={isExpanded ? "접기" : "휴직 상세/삭제"}
            title="휴직 상세 / 삭제"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        </td>
        <td className="px-3 py-2 align-middle whitespace-nowrap">
          <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline">
            {emp.name}
          </Link>
        </td>
        <td className="px-2 py-1 align-middle min-w-[7rem]">
          <CellText
            value={emp.employee_number ?? ""}
            onSave={(v) => onSaveField({ employee_number: v || null })}
            placeholder="-"
          />
        </td>
        <td className="px-2 py-1 align-middle min-w-[12rem]">
          <CellDepartment
            value={emp.department ?? ""}
            onSave={(v) => onSaveField({ department: v || null })}
          />
        </td>
        <td className="px-2 py-1 align-middle min-w-[8rem]">
          <CellText
            value={emp.part ?? ""}
            onSave={(v) => onSaveField({ part: v || null })}
            placeholder="-"
          />
        </td>
        <td className="px-2 py-1 align-middle min-w-[7rem]">
          <CellText
            value={emp.position ?? ""}
            onSave={(v) => onSaveField({ position: v || null })}
            placeholder="-"
          />
        </td>
        <td className="px-2 py-1 align-middle min-w-[10rem]">
          <CellText
            type="date"
            value={emp.hire_date ?? ""}
            onSave={(v) => onSaveField({ hire_date: v || null })}
          />
        </td>
        <td className="px-2 py-1 align-middle min-w-[7rem]">
          <select
            value={emp.status}
            onChange={(e) => onChangeStatus(e.target.value as EmployeeStatus)}
            className="text-xs !py-1 !px-2"
            disabled={saving}
          >
            <option value="active">재직</option>
            <option value="on_leave">휴직</option>
            <option value="resigned">퇴직</option>
          </select>
        </td>
        <td className="px-2 py-1 align-middle min-w-[12rem] whitespace-nowrap">
          {emp.status === "resigned" ? (
            <CellText
              type="date"
              value={emp.resignation_date ?? ""}
              onSave={(v) => onSaveField({ resignation_date: v || null })}
            />
          ) : emp.status === "on_leave" ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-left text-gray-700 hover:text-gray-900 underline-offset-2 hover:underline"
            >
              {formatLeavePeriod(emp)}
            </button>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={9} className="px-4 py-3">
            <ExpandedArea emp={emp} onSaveField={onSaveField} onDelete={onDelete} />
            {errorText && (
              <p className="text-sm text-red-700 mt-2">오류: {errorText}</p>
            )}
          </td>
        </tr>
      )}
      {!isExpanded && errorText && (
        <tr>
          <td colSpan={9} className="px-4 py-1 text-sm text-red-700">
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
