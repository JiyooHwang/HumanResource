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
  const known = DEPARTMENT_ORDER.some((d) => d === value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">(미배정)</option>
      {DEPARTMENT_ORDER.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
      {value && !known && (
        <option value={value}>{value} (목록 외)</option>
      )}
    </select>
  );
}
