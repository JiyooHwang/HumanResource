"use client";

import { useEffect, useState } from "react";
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
  const [options, setOptions] = useState<string[]>(DEPARTMENT_ORDER);

  useEffect(() => {
    fetch("/api/admin/lists")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.departments && data.departments.length > 0) {
          setOptions(data.departments.map((d: { name: string }) => d.name));
        }
      })
      .catch(() => {
        // Fallback to hardcoded list (already set as default)
      });
  }, []);

  const inList = !value || options.some(
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
      {options.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
      {!inList && (
        <option value="__custom__">{value} (직접 입력)</option>
      )}
    </select>
  );
}
