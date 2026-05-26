import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LEAVE_REASON_LABEL, type Employee } from "@/lib/types";

const HEADERS = [
  "입력일",
  "직원번호",
  "성명",
  "본부",
  "소속",
  "파트",
  "직책",
  "근무지",
  "재직상태",
  "입사확정일자",
  "출근일",
  "퇴사일",
  "마지막근무일",
  "휴직일자",
  "휴직종료예정일",
  "복직일자",
  "휴대전화",
  "사내메일",
  "외부메일",
  "비고",
  "사원증법인카드반납",
  "휴직사유",
  "휴직사유상세",
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
      e.created_at ? new Date(e.created_at).toLocaleDateString("ko-KR") : "",
      e.employee_number,
      e.name,
      e.headquarters,
      e.department,
      e.part,
      e.position,
      e.work_location,
      statusKo(e.status),
      e.hire_date,
      e.first_work_date,
      e.resignation_date,
      e.last_work_date,
      e.leave_start_date,
      e.leave_end_date,
      e.return_from_leave_date,
      e.phone,
      e.email,
      e.personal_email,
      e.notes,
      e.badge_card_returned,
      e.leave_reason ? LEAVE_REASON_LABEL[e.leave_reason] : null,
      e.leave_reason_detail,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = "﻿" + HEADERS.join(",") + "\n" + rows.join("\n");
  const filename = `employees_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
