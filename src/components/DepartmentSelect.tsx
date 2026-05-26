"use client";

import { DEPARTMENT_ORDER } from "@/lib/types";

export default function DepartmentSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const inList = !value || DEPARTMENT_ORDER.some(
    (d) => d.replace(/\s+/g, "").toLowerCase() === value.replace(/\s+/g, "").toLowerCase(),
  );
  return (
    <select
      value={inList ? value : "__custom__"}
      onChange={(e) => {
        if (e.target.value === "__custom__") return;
        onChange(e.target.value);
      }}
      className={className}
    >
      <option value="">(선택)</option>
      {DEPARTMENT_ORDER.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
      {!inList && (
        <option value="__custom__">{value} (직접 입력)</option>
      )}
    </select>
  );
}
