"use client";

import { useEffect, useState } from "react";

const DEFAULT_PARTS = ["1파트", "2파트", "3파트", "4파트"];

export default function PartSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [options, setOptions] = useState<string[]>(DEFAULT_PARTS);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    fetch("/api/admin/lists")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.parts && data.parts.length > 0) {
          setOptions(data.parts.map((p: { name: string }) => p.name));
        }
      })
      .catch(() => {});
  }, []);

  const inList = !value || options.some((p) => p === value);
  const isCustom = customMode || (!inList && !!value);

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="파트 직접 입력"
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
      {options.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
      <option value="__custom__">직접 입력...</option>
    </select>
  );
}
