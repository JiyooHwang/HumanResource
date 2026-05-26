"use client";

import { useEffect, useState } from "react";
import { HEADQUARTERS_ORDER } from "@/lib/types";

export default function HeadquartersSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [options, setOptions] = useState<string[]>(HEADQUARTERS_ORDER);

  useEffect(() => {
    fetch("/api/admin/lists")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.headquarters && data.headquarters.length > 0) {
          setOptions(data.headquarters.map((h: { name: string }) => h.name));
        }
      })
      .catch(() => {
        // Fallback to hardcoded list (already set as default)
      });
  }, []);

  const inList = !value || options.some((h) => h === value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">(선택)</option>
      {options.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
      {!inList && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
}
