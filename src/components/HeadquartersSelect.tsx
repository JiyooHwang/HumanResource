"use client";

import { HEADQUARTERS_ORDER } from "@/lib/types";

const DATALIST_ID = "headquarters-options";

export default function HeadquartersSelect({
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
        placeholder="선택 또는 직접 입력"
        className={className}
      />
      <datalist id={DATALIST_ID}>
        {HEADQUARTERS_ORDER.map((h) => (
          <option key={h} value={h} />
        ))}
      </datalist>
    </>
  );
}
