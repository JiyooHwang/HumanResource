"use client";

import { DEPARTMENT_ORDER } from "@/lib/types";

const DATALIST_ID = "department-options";

export function DepartmentDatalist() {
  return (
    <datalist id={DATALIST_ID}>
      {DEPARTMENT_ORDER.map((d) => (
        <option key={d} value={d} />
      ))}
    </datalist>
  );
}

export default function DepartmentSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <>
      <input
        list={DATALIST_ID}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="선택 또는 직접 입력 (겸직은 / 로 구분)"
        className={className}
      />
      <DepartmentDatalist />
    </>
  );
}
