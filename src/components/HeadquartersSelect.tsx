"use client";

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
  const inList = !value || HEADQUARTERS_ORDER.some((h) => h === value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">(선택)</option>
      {HEADQUARTERS_ORDER.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
      {!inList && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
}
