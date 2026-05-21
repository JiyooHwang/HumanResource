"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DepartmentSelect from "@/components/DepartmentSelect";
import {
  DEFAULT_ONBOARDING_TASKS,
  LEAVE_REASON_LABEL,
  type EmployeeStatus,
  type LeaveReason,
} from "@/lib/types";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    employee_number: "",
    email: "",
    phone: "",
    department: "",
    part: "",
    position: "",
    hire_date: "",
    status: "active" as EmployeeStatus,
    leave_start_date: "",
    leave_end_date: "",
    leave_reason: "" as "" | LeaveReason,
    leave_reason_detail: "",
    notes: "",
    seed_onboarding: true,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const isLeave = form.status === "on_leave";
    const { data, error: insertError } = await supabase
      .from("employees")
      .insert({
        name: form.name,
        employee_number: form.employee_number || null,
        email: form.email || null,
        phone: form.phone || null,
        department: form.department || null,
        part: form.part || null,
        position: form.position || null,
        hire_date: form.hire_date || null,
        status: form.status,
        leave_start_date: isLeave ? form.leave_start_date || null : null,
        leave_end_date: isLeave ? form.leave_end_date || null : null,
        leave_reason: isLeave ? form.leave_reason || null : null,
        leave_reason_detail:
          isLeave && form.leave_reason === "other"
            ? form.leave_reason_detail || null
            : null,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setLoading(false);
      setError(insertError?.message ?? "저장 실패");
      return;
    }

    if (form.seed_onboarding) {
      const tasks = DEFAULT_ONBOARDING_TASKS.map((task, i) => ({
        employee_id: data.id,
        kind: "onboarding" as const,
        task,
        sort_order: i,
      }));
      await supabase.from("checklist_items").insert(tasks);
    }

    router.push(`/employees/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">직원 등록</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>이름 *</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <label>사번</label>
            <input value={form.employee_number} onChange={(e) => update("employee_number", e.target.value)} />
          </div>
          <div>
            <label>이메일</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label>연락처</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label>부서</label>
            <DepartmentSelect
              value={form.department}
              onChange={(v) => update("department", v)}
            />
          </div>
          <div>
            <label>파트</label>
            <input
              value={form.part}
              onChange={(e) => update("part", e.target.value)}
              placeholder="예: 1파트, 캐릭터파트"
            />
          </div>
          <div>
            <label>직급</label>
            <input value={form.position} onChange={(e) => update("position", e.target.value)} />
          </div>
          <div>
            <label>입사일</label>
            <input type="date" value={form.hire_date} onChange={(e) => update("hire_date", e.target.value)} />
          </div>
          <div>
            <label>상태</label>
            <select value={form.status} onChange={(e) => update("status", e.target.value as EmployeeStatus)}>
              <option value="active">재직</option>
              <option value="on_leave">휴직</option>
              <option value="resigned">퇴직</option>
            </select>
          </div>
        </div>

        {form.status === "on_leave" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-3">
            <div className="text-sm font-medium text-yellow-900">휴직 정보</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label>휴직 시작일</label>
                <input
                  type="date"
                  value={form.leave_start_date}
                  onChange={(e) => update("leave_start_date", e.target.value)}
                />
              </div>
              <div>
                <label>휴직 종료(예정)일</label>
                <input
                  type="date"
                  value={form.leave_end_date}
                  onChange={(e) => update("leave_end_date", e.target.value)}
                />
              </div>
              <div>
                <label>휴직 사유</label>
                <select
                  value={form.leave_reason}
                  onChange={(e) => update("leave_reason", e.target.value as "" | LeaveReason)}
                >
                  <option value="">선택</option>
                  {(Object.keys(LEAVE_REASON_LABEL) as LeaveReason[]).map((k) => (
                    <option key={k} value={k}>
                      {LEAVE_REASON_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              {form.leave_reason === "other" && (
                <div>
                  <label>기타 사유 (직접 입력)</label>
                  <input
                    value={form.leave_reason_detail}
                    onChange={(e) => update("leave_reason_detail", e.target.value)}
                    placeholder="예: 학업, 질병 등"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label>메모</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="!w-auto"
            checked={form.seed_onboarding}
            onChange={(e) => update("seed_onboarding", e.target.checked)}
          />
          입사 체크리스트 기본 항목 자동 추가
        </label>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-500">
        * 기본 입사 체크리스트는 등록 후 자유롭게 수정/추가/삭제할 수 있습니다.
        퇴사 처리 시 퇴사 체크리스트를 추가할 수 있습니다.
      </p>
    </div>
  );
}
