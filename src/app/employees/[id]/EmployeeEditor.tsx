"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_OFFBOARDING_TASKS,
  DEFAULT_ONBOARDING_TASKS,
  type ChecklistItem,
  type ChecklistKind,
  type Employee,
  type EmployeeStatus,
} from "@/lib/types";

type Props = {
  employee: Employee;
  checklist: ChecklistItem[];
};

export default function EmployeeEditor({ employee, checklist: initialChecklist }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [emp, setEmp] = useState<Employee>(employee);
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const onboarding = items.filter((i) => i.kind === "onboarding");
  const offboarding = items.filter((i) => i.kind === "offboarding");

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase
      .from("employees")
      .update({
        name: emp.name,
        employee_number: emp.employee_number,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        position: emp.position,
        hire_date: emp.hire_date,
        resignation_date: emp.resignation_date,
        status: emp.status,
        notes: emp.notes,
      })
      .eq("id", emp.id);
    setSavingProfile(false);
    setProfileMsg(error ? `오류: ${error.message}` : "저장됨");
    if (!error) router.refresh();
  }

  async function deleteEmployee() {
    if (!confirm(`'${emp.name}' 직원을 삭제할까요? 체크리스트도 함께 삭제됩니다.`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", emp.id);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/employees");
  }

  async function startOffboarding() {
    if (offboarding.length > 0) return;
    const rows = DEFAULT_OFFBOARDING_TASKS.map((task, i) => ({
      employee_id: emp.id,
      kind: "offboarding" as const,
      task,
      sort_order: i,
    }));
    const { data, error } = await supabase.from("checklist_items").insert(rows).select("*");
    if (error) {
      alert(error.message);
      return;
    }
    setItems([...items, ...(data as ChecklistItem[])]);
  }

  async function seedOnboarding() {
    if (onboarding.length > 0) return;
    const rows = DEFAULT_ONBOARDING_TASKS.map((task, i) => ({
      employee_id: emp.id,
      kind: "onboarding" as const,
      task,
      sort_order: i,
    }));
    const { data, error } = await supabase.from("checklist_items").insert(rows).select("*");
    if (error) {
      alert(error.message);
      return;
    }
    setItems([...items, ...(data as ChecklistItem[])]);
  }

  async function toggleItem(item: ChecklistItem) {
    const completed = !item.completed;
    let completed_by = item.completed_by;
    if (completed && !completed_by) {
      completed_by = prompt("완료자 이름 (선택)") || null;
    }
    const completed_at = completed ? new Date().toISOString() : null;
    const optimistic = items.map((i) =>
      i.id === item.id ? { ...i, completed, completed_at, completed_by } : i,
    );
    setItems(optimistic);
    const { error } = await supabase
      .from("checklist_items")
      .update({ completed, completed_at, completed_by })
      .eq("id", item.id);
    if (error) alert(error.message);
  }

  async function addItem(kind: ChecklistKind, task: string) {
    if (!task.trim()) return;
    const max = Math.max(0, ...items.filter((i) => i.kind === kind).map((i) => i.sort_order));
    const { data, error } = await supabase
      .from("checklist_items")
      .insert({ employee_id: emp.id, kind, task: task.trim(), sort_order: max + 1 })
      .select("*")
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    setItems([...items, data as ChecklistItem]);
  }

  async function removeItem(id: string) {
    if (!confirm("이 항목을 삭제할까요?")) return;
    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">
            {emp.name}{" "}
            <span className="text-base text-gray-500">
              {emp.department ?? ""} {emp.position ?? ""}
            </span>
          </h1>
          <button
            onClick={deleteEmployee}
            className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-3 py-1 rounded-md"
          >
            직원 삭제
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="이름 *">
            <input value={emp.name} onChange={(e) => setEmp({ ...emp, name: e.target.value })} />
          </Field>
          <Field label="사번">
            <input
              value={emp.employee_number ?? ""}
              onChange={(e) => setEmp({ ...emp, employee_number: e.target.value || null })}
            />
          </Field>
          <Field label="이메일">
            <input
              type="email"
              value={emp.email ?? ""}
              onChange={(e) => setEmp({ ...emp, email: e.target.value || null })}
            />
          </Field>
          <Field label="연락처">
            <input
              value={emp.phone ?? ""}
              onChange={(e) => setEmp({ ...emp, phone: e.target.value || null })}
            />
          </Field>
          <Field label="부서">
            <input
              value={emp.department ?? ""}
              onChange={(e) => setEmp({ ...emp, department: e.target.value || null })}
            />
          </Field>
          <Field label="직급">
            <input
              value={emp.position ?? ""}
              onChange={(e) => setEmp({ ...emp, position: e.target.value || null })}
            />
          </Field>
          <Field label="입사일">
            <input
              type="date"
              value={emp.hire_date ?? ""}
              onChange={(e) => setEmp({ ...emp, hire_date: e.target.value || null })}
            />
          </Field>
          <Field label="퇴사일">
            <input
              type="date"
              value={emp.resignation_date ?? ""}
              onChange={(e) => setEmp({ ...emp, resignation_date: e.target.value || null })}
            />
          </Field>
          <Field label="상태">
            <select
              value={emp.status}
              onChange={(e) => setEmp({ ...emp, status: e.target.value as EmployeeStatus })}
            >
              <option value="active">재직</option>
              <option value="on_leave">휴직</option>
              <option value="resigned">퇴직</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <label>메모</label>
          <textarea
            rows={3}
            value={emp.notes ?? ""}
            onChange={(e) => setEmp({ ...emp, notes: e.target.value || null })}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {savingProfile ? "저장 중..." : "프로필 저장"}
          </button>
          {profileMsg && <span className="text-sm text-gray-600">{profileMsg}</span>}
        </div>
      </div>

      <ChecklistSection
        title="입사 체크리스트"
        kind="onboarding"
        items={onboarding}
        onAdd={(t) => addItem("onboarding", t)}
        onToggle={toggleItem}
        onRemove={removeItem}
        onSeed={onboarding.length === 0 ? seedOnboarding : undefined}
      />

      <ChecklistSection
        title="퇴사 체크리스트"
        kind="offboarding"
        items={offboarding}
        onAdd={(t) => addItem("offboarding", t)}
        onToggle={toggleItem}
        onRemove={removeItem}
        onSeed={offboarding.length === 0 ? startOffboarding : undefined}
        seedLabel="퇴사 체크리스트 시작"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function ChecklistSection({
  title,
  items,
  onAdd,
  onToggle,
  onRemove,
  onSeed,
  seedLabel = "기본 항목 추가",
}: {
  title: string;
  kind: ChecklistKind;
  items: ChecklistItem[];
  onAdd: (task: string) => void;
  onToggle: (item: ChecklistItem) => void;
  onRemove: (id: string) => void;
  onSeed?: () => void;
  seedLabel?: string;
}) {
  const [newTask, setNewTask] = useState("");
  const done = items.filter((i) => i.completed).length;

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">
          {title}{" "}
          <span className="text-sm text-gray-500">
            {done}/{items.length}
          </span>
        </h2>
        {onSeed && (
          <button
            onClick={onSeed}
            className="text-sm bg-gray-900 text-white px-3 py-1 rounded-md hover:bg-gray-800"
          >
            {seedLabel}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">항목이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="py-2 flex items-center gap-3">
              <input
                type="checkbox"
                className="!w-auto"
                checked={item.completed}
                onChange={() => onToggle(item)}
              />
              <div className="flex-1">
                <div className={item.completed ? "line-through text-gray-400" : ""}>{item.task}</div>
                {item.completed && (item.completed_by || item.completed_at) && (
                  <div className="text-xs text-gray-500">
                    {item.completed_by ?? "익명"} ·{" "}
                    {item.completed_at ? new Date(item.completed_at).toLocaleString("ko-KR") : ""}
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(newTask);
          setNewTask("");
        }}
      >
        <input
          placeholder="새 항목 추가"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button
          type="submit"
          className="bg-white border border-gray-300 px-3 rounded-md hover:bg-gray-50 text-sm whitespace-nowrap"
        >
          추가
        </button>
      </form>
    </section>
  );
}
