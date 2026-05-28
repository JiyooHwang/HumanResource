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
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    fetch("/api/admin/lists")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.departments && data.departments.length > 0) {
          setOptions(data.departments.map((d: { name: string }) => d.name));
        }
      })
      .catch(() => {});
  }, []);

  const inList = !value || options.some(
    (d) => d.replace(/\s+/g, "").toLowerCase() === value.replace(/\s+/g, "").toLowerCase(),
  );

  // 목록에 없는 값이 이미 있으면 직접 입력 모드로
  const isCustom = customMode || (!inList && !!value);

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="소속 직접 입력"
          className={className}
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false);
            onChange("");
          }}
          className="text-xs text-gray-500 hover:text-gray-800 whitespace-nowrap px-1"
          title="목록에서 선택"
        >
          목록
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__custom__") {
          setCustomMode(true);
          return;
        }
        onChange(e.target.value);
      }}
      className={className}
    >
      <option value="">(선택)</option>
      {options.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
      <option value="__custom__">직접 입력...</option>
    </select>
  );
}
