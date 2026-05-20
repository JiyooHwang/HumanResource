import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";

const HEADERS = [
  "사번",
  "이름",
  "이메일",
  "연락처",
  "부서",
  "직급",
  "입사일",
  "퇴사일",
  "상태",
  "메모",
];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function statusKo(s: Employee["status"]): string {
  return s === "active" ? "재직" : s === "on_leave" ? "휴직" : "퇴직";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase.from("employees").select("*").order("hire_date", { ascending: false, nullsFirst: false });
  if (status && ["active", "on_leave", "resigned"].includes(status)) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const employees = (data ?? []) as Employee[];
  const rows = employees.map((e) =>
    [
      e.employee_number,
      e.name,
      e.email,
      e.phone,
      e.department,
      e.position,
      e.hire_date,
      e.resignation_date,
      statusKo(e.status),
      e.notes,
    ]
      .map(csvEscape)
      .join(","),
  );

  // Excel 한글 깨짐 방지 BOM
  const csv = "﻿" + HEADERS.join(",") + "\n" + rows.join("\n");
  const filename = `employees_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
