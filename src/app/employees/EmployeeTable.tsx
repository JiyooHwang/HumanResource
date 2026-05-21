"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LEAVE_REASON_LABEL,
  type Employee,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "재직",
  on_leave: "휴직",
  resigned: "퇴직",
};

const STATUS_BADGE: Record<EmployeeStatus, string> = {
  active: "bg-green-100 text-green-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  resigned: "bg-gray-200 text-gray-700",
};

type EditState = {
  status: EmployeeStatus;
  employee_number: string;
  department: string;
  position: string;
  leave_start_date: string;
  leave_end_date: string;
  leave_reason: "" | LeaveReason;
  leave_reason_detail: string;
  resignation_date: string;
};

function formatPeriod(e: Employee): string {
  if (e.status === "on_leave") {
    const start = e.leave_start_date ?? "?";
    const end = e.leave_end_date ?? "미정";
    if (!e.leave_start_date && !e.leave_end_date) return "기간 미입력";
    return `${start} ~ ${end}`;
  }
  if (e.status === "resigned") {
    return e.resignation_date ?? "퇴사일 미입력";
  }
  return "-";
}

function toEditState(e: Employee): EditState {
  return {
    status: e.status,
    employee_number: e.employee_number ?? "",
    department: e.department ?? "",
    position: e.position ?? "",
    leave_start_date: e.leave_start_date ?? "",
    leave_end_date: e.leave_end_date ?? "",
    leave_reason: e.leave_reason ?? "",
    leave_reason_detail: e.leave_reason_detail ?? "",
    resignation_date: e.resignation_date ?? "",
  };
}

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  function startEdit(emp: Employee) {
    if (expandedId === emp.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(emp.id);
    setEdits((prev) => ({ ...prev, [emp.id]: toEditState(emp) }));
    setMsg(null);
  }

  function updateEdit(id: string, patch: Partial<EditState>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function save(emp: Employee) {
    const e = edits[emp.id];
    if (!e) return;
    setSavingId(emp.id);
    setMsg(null);

    const isLeave = e.status === "on_leave";
    const isResigned = e.status === "resigned";

    const { error } = await supabase
      .from("employees")
      .update({
        status: e.status,
        employee_number: e.employee_number || null,
        department: e.department || null,
        position: e.position || null,
        leave_start_date: isLeave ? e.leave_start_date || null : null,
        leave_end_date: isLeave ? e.leave_end_date || null : null,
        leave_reason: isLeave ? e.leave_reason || null : null,
        leave_reason_detail:
          isLeave && e.leave_reason === "other" ? e.leave_reason_detail || null : null,
        resignation_date: isResigned
          ? e.resignation_date || new Date().toISOString().slice(0, 10)
          : e.resignation_date || null,
      })
      .eq("id", emp.id);

    setSavingId(null);

    if (error) {
      setMsg({ id: emp.id, text: `오류: ${error.message}`, ok: false });
      return;
    }
    setMsg({ id: emp.id, text: "저장됨", ok: true });
    router.refresh();
    setTimeout(() => {
      setMsg((m) => (m?.id === emp.id ? null : m));
      setExpandedId((id) => (id === emp.id ? null : id));
    }, 1200);
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
      setMsg({ id: emp.id, text: `오류: ${error.message}`, ok: false });
      return;
    }
    setExpandedId(null);
    router.refresh();
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        등록된 직원이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-2 w-8"></th>
            <th className="text-left px-4 py-2">이름</th>
            <th className="text-left px-4 py-2">사번</th>
            <th className="text-left px-4 py-2">부서</th>
            <th className="text-left px-4 py-2">직급</th>
            <th className="text-left px-4 py-2">입사일</th>
            <th className="text-left px-4 py-2">상태</th>
            <th className="text-left px-4 py-2">기간 / 퇴사일</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => {
            const isOpen = expandedId === e.id;
            const edit = edits[e.id];
            const editIsLeave = edit?.status === "on_leave";
            const editIsResigned = edit?.status === "resigned";
            return (
              <Row
                key={e.id}
                emp={e}
                isOpen={isOpen}
                edit={edit}
                editIsLeave={editIsLeave}
                editIsResigned={editIsResigned}
                onToggle={() => startEdit(e)}
                onUpdate={(patch) => updateEdit(e.id, patch)}
                onSave={() => save(e)}
                onDelete={() => remove(e)}
                saving={savingId === e.id}
                msg={msg?.id === e.id ? msg : null}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  emp,
  isOpen,
  edit,
  editIsLeave,
  editIsResigned,
  onToggle,
  onUpdate,
  onSave,
  onDelete,
  saving,
  msg,
}: {
  emp: Employee;
  isOpen: boolean;
  edit: EditState | undefined;
  editIsLeave: boolean;
  editIsResigned: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<EditState>) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  msg: { text: string; ok: boolean } | null;
}) {
  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-700 w-6 h-6 flex items-center justify-center"
            aria-label={isOpen ? "닫기" : "빠른 편집"}
          >
            {isOpen ? "▾" : "▸"}
          </button>
        </td>
        <td className="px-4 py-2">
          <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline">
            {emp.name}
          </Link>
        </td>
        <td className="px-4 py-2 text-gray-700">{emp.employee_number ?? "-"}</td>
        <td className="px-4 py-2 text-gray-700">{emp.department ?? "-"}</td>
        <td className="px-4 py-2 text-gray-700">{emp.position ?? "-"}</td>
        <td className="px-4 py-2 text-gray-700">{emp.hire_date ?? "-"}</td>
        <td className="px-4 py-2">
          <button
            type="button"
            onClick={onToggle}
            className={`inline-block px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 ${STATUS_BADGE[emp.status]}`}
            title="클릭해서 상태 변경"
          >
            {STATUS_LABEL[emp.status]}
            {emp.status === "on_leave" && emp.leave_reason && (
              <>
                {" · "}
                {emp.leave_reason === "other"
                  ? emp.leave_reason_detail || "기타"
                  : LEAVE_REASON_LABEL[emp.leave_reason]}
              </>
            )}
          </button>
        </td>
        <td className="px-4 py-2 text-gray-700">
          <button
            type="button"
            onClick={onToggle}
            className="text-left hover:text-gray-900"
            title="클릭해서 편집"
          >
            {formatPeriod(emp)}
          </button>
        </td>
      </tr>
      {isOpen && edit && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={8} className="px-4 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[7rem]">
                <label className="text-xs">사번</label>
                <input
                  value={edit.employee_number}
                  onChange={(ev) => onUpdate({ employee_number: ev.target.value })}
                />
              </div>
              <div className="min-w-[8rem]">
                <label className="text-xs">부서</label>
                <input
                  value={edit.department}
                  onChange={(ev) => onUpdate({ department: ev.target.value })}
                />
              </div>
              <div className="min-w-[7rem]">
                <label className="text-xs">직급</label>
                <input
                  value={edit.position}
                  onChange={(ev) => onUpdate({ position: ev.target.value })}
                />
              </div>
              <div className="min-w-[8rem]">
                <label className="text-xs">상태</label>
                <select
                  value={edit.status}
                  onChange={(ev) => onUpdate({ status: ev.target.value as EmployeeStatus })}
                >
                  <option value="active">재직</option>
                  <option value="on_leave">휴직</option>
                  <option value="resigned">퇴직</option>
                </select>
              </div>

              {editIsLeave && (
                <>
                  <div className="min-w-[10rem]">
                    <label className="text-xs">휴직 시작일</label>
                    <input
                      type="date"
                      value={edit.leave_start_date}
                      onChange={(ev) => onUpdate({ leave_start_date: ev.target.value })}
                    />
                  </div>
                  <div className="min-w-[10rem]">
                    <label className="text-xs">휴직 종료(예정)일</label>
                    <input
                      type="date"
                      value={edit.leave_end_date}
                      onChange={(ev) => onUpdate({ leave_end_date: ev.target.value })}
                    />
                  </div>
                  <div className="min-w-[8rem]">
                    <label className="text-xs">사유</label>
                    <select
                      value={edit.leave_reason}
                      onChange={(ev) =>
                        onUpdate({ leave_reason: ev.target.value as "" | LeaveReason })
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
                  {edit.leave_reason === "other" && (
                    <div className="min-w-[12rem]">
                      <label className="text-xs">기타 사유</label>
                      <input
                        value={edit.leave_reason_detail}
                        onChange={(ev) => onUpdate({ leave_reason_detail: ev.target.value })}
                        placeholder="직접 입력"
                      />
                    </div>
                  )}
                </>
              )}

              {editIsResigned && (
                <div className="min-w-[10rem]">
                  <label className="text-xs">퇴사일</label>
                  <input
                    type="date"
                    value={edit.resignation_date}
                    onChange={(ev) => onUpdate({ resignation_date: ev.target.value })}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "저장 중..." : "저장"}
              </button>

              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-2 rounded-md disabled:opacity-60"
              >
                삭제
              </button>

              {msg && (
                <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>
                  {msg.text}
                </span>
              )}

              <Link
                href={`/employees/${emp.id}`}
                className="ml-auto text-sm text-gray-500 hover:text-gray-800"
              >
                상세 페이지에서 더 자세히 →
              </Link>
            </div>
            {emp.status === "on_leave" && (
              <p className="text-xs text-gray-500 mt-2">
                ⓘ 상태를 휴직이 아닌 다른 값으로 바꾸고 저장하면, 현재 휴직 정보가 자동으로 휴직 이력에 보관됩니다.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
